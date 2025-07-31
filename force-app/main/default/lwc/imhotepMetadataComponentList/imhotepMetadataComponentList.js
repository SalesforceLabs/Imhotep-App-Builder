// *******************************************************************************************
// @Name		    imhotepMetadataComponentList
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date		    01/11/2025
// @Description	    LWC displays a categorized list of Metadata_Component__c records for a given project.
// @Used            iab__Project_Record_Page Lightning record page
// *******************************************************************************************
// COPYRIGHT AND LICENSE
// Copyright (c) 2023, Salesforce, Inc.
// SPDX-License-Identifier: Apache-2
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the
// License. You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS"
// BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language
// governing permissions and limitations under the License.
// *******************************************************************************************

import { LightningElement, api, wire, track } from 'lwc';
import { refreshApex } from '@salesforce/apex';

// import object and field info
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import METADATA_COMPONENT_OBJECT from '@salesforce/schema/Metadata_Component__c';
import METADATA_COMPONENT_CATEGORY_FIELD from '@salesforce/schema/Metadata_Component__c.Category__c';

// import Apex
import getImhotepActiveMetadata from '@salesforce/apex/ImhotepAppBuilderCtrl.getImhotepActiveMetadata';
import getMetadataComponents from '@salesforce/apex/ImhotepAppBuilderCtrl.getMetadataComponents';
import getProjectMetadataTypes from '@salesforce/apex/ImhotepAppBuilderCtrl.getProjectMetadataTypes';

// import components
import ImhotepFlowModal from 'c/imhotepFlowModal';

// import custom labels
import ActionAddMetadataLabel from "@salesforce/label/c.ActionAddMetadataLabel";
import HeadingMetadataComponents from "@salesforce/label/c.HeadingMetadataComponents";
import MetadataTypeAllLabel from "@salesforce/label/c.MetadataTypeAllLabel";
import MetadataEmptyHeading from "@salesforce/label/c.MetadataEmptyHeading";
import MetadataEmptyText1 from "@salesforce/label/c.MetadataEmptyText1";
import MetadataEmptyText2 from "@salesforce/label/c.MetadataEmptyText2";
import MetadataFieldNameLabel from "@salesforce/label/c.MetadataFieldNameLabel";
import MetadataFieldAPINameLabel from "@salesforce/label/c.MetadataFieldAPINameLabel";
import MetadataFieldCategoryLabel from "@salesforce/label/c.MetadataFieldCategoryLabel";
import MetadataFieldMetadataTypeLabel from "@salesforce/label/c.MetadataFieldMetadataTypeLabel";

// import static resources
import EMPTY_IMAGE_02 from '@salesforce/resourceUrl/ImhotepIllustrationEmptyState02';

export default class ImhotepMetadataComponentList extends LightningElement {

    // set incoming variables
    @api recordId;                              // current page's iab__Project__c recordId

    metadataComponentCategoryMap = [];          // stores a value-to-label mapping for translation of the Metadata Component iab__Category__c picklist

    // header variables
    headerTitle;                                // used as a header title
    headerHelp;                                 // help text that explains how to use the component
    headerUrl;                                  // used to hold the calculated URL for accessing the full standard related list

    // prep variables for receiving results of Apex methods
    activeMetadata;                             // holds the active iab__Imhotep_Config__mdt metadata record
    
    // prep variables for receiving results of Apex methods
    showEmptyState = false;                     // controls whether or not to hide the data-table and instead display an empty state illustration card
    metadataTypes = [];                         // array for holding metadata type picklist values
    wiredData;
    @track mockData = [];                       // holds the mutated list of records to use in the table, containing miscellaneous values that weren't originally part of the object records
    allComponentsRaw = [];
    dataReadyForProcessing = false;             // flag to confirm that the main data wire adapter has run without error
    filteredMockData = [];                      // filtered collection of iab__Metadata_Component__c records
    recordCount;                                // number of metadata components in the selected metadata type

    sortDirectionDefault = 'asc';               // standard default sort direction for unsorted columns
    sortedBy = 'Metadata_Component';            // initial column the filteredMockData data is sorted by
    sortDirection = 'desc';                     // initial order the filteredMockData is sorted by
    sortedByTemp;                               // temporary value used for the actual sort (allows url columns to be sorted by column labels instead)

    isLoading = true;                           // initialize as true to display a spinner while data is loading

    // define custom labels
    label = {
        ActionAddMetadataLabel,
        HeadingMetadataComponents,
        MetadataTypeAllLabel,
        MetadataEmptyHeading,
        MetadataEmptyText1,
        MetadataEmptyText2,
        MetadataFieldNameLabel,
        MetadataFieldAPINameLabel,
        MetadataFieldCategoryLabel,
        MetadataFieldMetadataTypeLabel,
    }

    // static resource variables
    imageEmptyState02 = EMPTY_IMAGE_02;         // holds the static resource illustration displayed in the empty state of the table

    // data table column formatting
    columns = [
        // Col: Metadata Component (Metadata_Component/Metadata_Component_URL)
        {
            label: this.label.MetadataFieldNameLabel,
            fieldName: 'Metadata_Component_URL',
            type: 'url',
            typeAttributes: {
                label: { fieldName: 'Metadata_Component' }
            },
            sortable: true
        },
        
        // Col: Metadata Component API Name (API_Name)
        {
            label: this.label.MetadataFieldAPINameLabel,
            fieldName: 'API_Name',
            type: 'text',
            initialWidth: 300,
            wrapText: true,
            sortable: true
        },
        
        // Col: Category (Category)
        {
            label: this.label.MetadataFieldCategoryLabel,
            fieldName: 'Category',
            type: 'text',
            initialWidth: 100,
            wrapText: true,
            sortable: true
        }
    ];



    // ======================================
    // LIFECYCLE HOOKS
    // ======================================

    connectedCallback(){
        // prepare an initial value for the header
        this.headerTitle = this.label.HeadingMetadataComponents;

        // prepare the help text content for the 
        this.headerHelp = this.label.MetadataEmptyText2;
        
        // prepare the URL used in the list header for accessing the full standard related list
        this.headerUrl = '/lightning/r/iab__Project__c/' + this.recordId + '/related/iab__Metadata_Components__r/view';
    }



    // ======================================
    // WIRE ADAPTER METHODS
    // ======================================

    // retrieves info about the iab__Metadata_Compoent__c object
    @wire(getObjectInfo, {
        objectApiName: METADATA_COMPONENT_OBJECT
    })
    metadataComponentObjectInfo;



    // retrieves active picklist values for the iab__Metadata_Component__c object's iab__Category__c field
    @wire(getPicklistValues, {
        recordTypeId: '$metadataComponentObjectInfo.data.defaultRecordTypeId',
        fieldApiName: METADATA_COMPONENT_CATEGORY_FIELD
    })
    metadataComponentCategoryPicklistValues({ data, error }) {
        if (data) {
            this.metadataComponentCategoryMap = data.values.map(val => ({
                label: val.label,
                value: val.value
            }));

            // trigger the processing method
            this.processData();
            
        } else if (error) {
            console.error('Error loading Metadata Component Category picklist values:', error);
        }
    }


    
    // wire the getImhotepActiveMetadata() method
    @wire(getImhotepActiveMetadata)
    wiredActiveMetadata({ error, data }) {
        if (data) {
            this.activeMetadata = data
        } else if (error) {
            console.error('Error retrieving active metadata: ', error);
        }
    }

    

    // wire the getMetadataComponents() method
    // retrieve all iab__Metadata_Component__c records for a specific iab__Project__c
    @wire(getMetadataComponents, {
        paramProjectId: '$recordId'
    })
    wiredData(value) {
        // Hold on to the provisioned value so we can refresh it later.
        this.wiredData = value; // track the provisioned value
        const { data, error } = value; // destructure the provisioned value

        if (data) {
            // store raw data; transformations and translations will happen in processData()
            this.allComponentsRaw = data;
            
            // trigger the processing method
            this.dataReadyForProcessing = true;
            this.processData();
        }
        else if (error) {
            this.dataReadyForProcessing = false;
            this.recordCount = 0;
            this.filteredMockData = [];
            this.showEmptyState = true;
            this.isLoading = false;
            
            // prep the header text to include the number of records
            this.headerTitle = this.label.HeadingMetadataComponents + ' (' + this.recordCount + ')';

            console.error('Error retrieving metadata components: ', error);
        }
    }



    // wire the getUsedMetadataTypes() method
    // retrieves all iab__Metadata_Type__c picklist values used by the project's metadata components
    @wire(getProjectMetadataTypes, {
        paramProjectId: '$recordId'
    })
    wiredMetadataTypes({ error, data }) {
        if (data) {
            this.metadataTypes = data;
        } else if (error) {
            console.error(error);
        }
    }



    // ======================================
    // EVENT HANDLER METHODS
    // ======================================

    // event handler when a metadata type is selected
    // handles data prep/filtering, display, and styling
    handleMetadataTypeSelection(event) {
        this.selectedMetadataType = event.target.dataset.metadatatype;

        // filter the metadata components by the selected metadata type
        this.filteredMockData = [];
        this.recordCount = 0;
        if (this.mockData && this.mockData.length > 0) {
            
            if(this.selectedMetadataType == 'all') {
                this.filteredMockData = this.mockData;
            }
            else {
                this.filteredMockData = this.mockData.filter((component) => {
                    const metadataType = component.Metadata_Type || '';
                    return (
                        this.selectedMetadataType.length === 0 ||
                        metadataType.includes(this.selectedMetadataType)
                    );
                });
            }
            
            this.recordCount = this.filteredMockData.length;
        } else {
            console.warn('Metadata Components not yet available for filtering.');
        }

        // force reactivity update
        this.filteredMockData = [...this.filteredMockData];

        // change css styling for selected/unselected metadata types
        
        // reset all divs to the unselected class
        const allDivs = this.template.querySelectorAll('.iab-selected-metadata-type');
        allDivs.forEach(div => {
            div.classList.remove('iab-selected');
            div.classList.add('iab-unselected');
        });

        // set the clicked div to the selected class
        event.target.classList.remove('iab-unselected');
        event.target.classList.add('iab-selected');
    }



    // handles resorting of the table when a column header is clicked
    handleSort(event) {
        // store property values for comparison before they are overwritten
        const sortedByPrior = this.sortedBy;
        const sortDirectionPrior = this.sortDirection;
        
        // get new values from clicked on column and update properties
        const { fieldName: sortedBy, sortDirection } = event.detail;
        this.sortedBy = sortedBy;
        this.sortDirection = sortDirection;

        if (this.sortedBy === sortedByPrior) {
            this.sortDirection = sortDirectionPrior === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortDirection = 'asc';
        }

        this.sortData();
    }



    // open flow to create a metadata component when the button is clicked
    // related metadata field is:   iab__Project_Add_Metadata_Component__c
    // related flow API name is:    iab__Imhotep_Project_AddMetadataComponent
    openAddMetadataComponentFlow(event) {
        const result = ImhotepFlowModal.open({
            size: 'medium',
            label: this.label.ActionAddMetadataLabel,
            flowAPIName: this.activeMetadata.iab__Project_Add_Metadata_Component__c,
            inputVariables: [
                {
                    name: 'recordId',
                    type: 'String',
                    value: this.recordId
                }
            ]
        }).then((result) => {
            refreshApex(this.wiredData);
        });
    }



    // ======================================
    // PRIVATE HELPER METHODS
    // ======================================

    // processes data and applies translations once all dependencies are met
    processData() {
        // ensure all data dependencies are met before proceeding
        // check if raw data exists and if the metadataComponentCategoryMap is populated
        if (!this.dataReadyForProcessing || !this.metadataComponentCategoryMap || this.metadataComponentCategoryMap.length === 0) {
            // console.log('processData: Waiting for all data dependencies to be met.');
            this.isLoading = true;      // keep spinner if data is not ready
            return;
        }

        // helper function to get translated Metadata Comoponent Category
        const getTranslatedMetadataComponentCategory = (categoryValue) => {
            const match = this.metadataComponentCategoryMap.find(item => item.value === categoryValue);
            return match ? match.label : categoryValue;       // fallback to original value if no translation found
        };

        // reset
        this.mockData = [];

        this.mockData = this.allComponentsRaw.map(metacomp => ({
            Id: metacomp.Id,
            API_Name: metacomp.iab__API_Name__c,
            Category: getTranslatedMetadataComponentCategory(metacomp.iab__Category__c),
            Metadata_Component: metacomp.Name,
            Metadata_Component_URL: '/lightning/r/iab__Metadata_Component__c/' + metacomp.Id + '/view',
            Metadata_Type: metacomp.iab__Metadata_Type__c
        }));

        this.recordCount = this.mockData.length;
        if(this.recordCount > 0) {
            this.filteredMockData = this.mockData;
            this.showEmptyState = false;
        }
        else {
            this.showEmptyState = true;
        }

        // console.log('this.recordCount: ' + this.recordCount);

        // prep the header text to include the number of records
        this.headerTitle = this.label.HeadingMetadataComponents + ' (' + this.recordCount + ')';

        this.isLoading = false;
    }



    // sorts mockData based on the current value of sortedColumn and sortDirection
    // this is a separate method so that it can be called from a handler for a column header click, or separately (not used elsewhere, this is more for future-proofing composability).
    sortData() {
        // find the column definition for the current sortedBy field
        const column = this.columns.find(col => col.fieldName === this.sortedBy);

        // set the sortedBy value to use during the sort;
        // if the column's data type is 'url', set sortedByTemp to the typeAttributes label fieldName instead
        // else set sortedByTemp to sortedBy
        // because these columns should be sorted by the label, not the url
        if (column && column.type === 'url') {
            this.sortedByTemp = column.typeAttributes.label.fieldName;
        } else {
            this.sortedByTemp = this.sortedBy;
        }
        
        // sort the filteredMockData
        // the data the user is currently viewing
        let sortedFilteredMockData = JSON.parse(JSON.stringify(this.filteredMockData));
        
        sortedFilteredMockData.sort((a, b) => {
            let aVal = (a[this.sortedByTemp] || '').toLowerCase(); // handle blank values and convert to lowercase
            let bVal = (b[this.sortedByTemp] || '').toLowerCase(); // handle blank values and convert to lowercase
            let reverse = this.sortDirection === 'asc' ? 1 : -1;

            if (aVal === '') return 1 * reverse;        // move blank values to the bottom
            if (bVal === '') return -1 * reverse;       // move blank values to the bottom
            return aVal > bVal ? 1 * reverse : aVal < bVal ? -1 * reverse : 0;
        });
        this.filteredMockData = sortedFilteredMockData;
        
        // sort the mockData
        // so that if the user changes the metadata type, the new filtered data will be properly sorted when it appears
        let sortedMockData = JSON.parse(JSON.stringify(this.mockData));
        
        sortedMockData.sort((a, b) => {
            let aVal = (a[this.sortedByTemp] || '').toLowerCase(); // handle blank values and convert to lowercase
            let bVal = (b[this.sortedByTemp] || '').toLowerCase(); // handle blank values and convert to lowercase
            let reverse = this.sortDirection === 'asc' ? 1 : -1;

            if (aVal === '') return 1 * reverse;        // move blank values to the bottom
            if (bVal === '') return -1 * reverse;       // move blank values to the bottom
            return aVal > bVal ? 1 * reverse : aVal < bVal ? -1 * reverse : 0;
        });
        this.mockData = sortedMockData;

        this.sortedByTemp = '';
    }
}