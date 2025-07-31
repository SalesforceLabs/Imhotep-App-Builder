// *******************************************************************************************
// @Name		    imhotepStoryChanges
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date		    06/18/2024
// @Description	    LWC displays a Story's Metadata Component Changes and allows them to be managed.
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
import Id from "@salesforce/user/Id";

// import object and field info
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import CHANGE_OBJECT from '@salesforce/schema/Metadata_Component_Change__c';
import CHANGE_TYPE_FIELD from '@salesforce/schema/Metadata_Component_Change__c.Change_Type__c';

// import Apex
import getImhotepActiveMetadata from '@salesforce/apex/ImhotepAppBuilderCtrl.getImhotepActiveMetadata';
import getProjectId from '@salesforce/apex/ImhotepAppBuilderCtrl.getProjectId';
import getStoryChanges from '@salesforce/apex/ImhotepAppBuilderCtrl.getStoryChanges';
import ImhotepFlowModal from 'c/imhotepFlowModal';

// import custom labels
import ActionDeleteMetadataChangeLabel from "@salesforce/label/c.ActionDeleteMetadataChangeLabel";
import ActionEditMetadataChangeLabel from "@salesforce/label/c.ActionEditMetadataChangeLabel";
import ActionLogMetadataChangeLabel from "@salesforce/label/c.ActionLogMetadataChangeLabel";
import ActionTableColActionsLabel from "@salesforce/label/c.ActionTableColActionsLabel";
import ChangeEmptyHeading from "@salesforce/label/c.ChangeEmptyHeading";
import ChangeEmptyText1 from "@salesforce/label/c.ChangeEmptyText1";
import ChangeEmptyText2 from "@salesforce/label/c.ChangeEmptyText2";
import ChangeFieldChangeLabel from "@salesforce/label/c.ChangeFieldChangeLabel";
import ChangeFieldChangeNotesLabel from "@salesforce/label/c.ChangeFieldChangeNotesLabel";
import ChangeFieldChangeTypeLabel from "@salesforce/label/c.ChangeFieldChangeTypeLabel";
import ChangeFieldLastModifiedLabel from "@salesforce/label/c.ChangeFieldLastModifiedLabel";
import ChangeFieldMetadataComponentLabel from "@salesforce/label/c.ChangeFieldMetadataComponentLabel";
import ChangeFieldMetadataTypeLabel from "@salesforce/label/c.ChangeFieldMetadataTypeLabel";
import HeadingMetadataChanges from "@salesforce/label/c.HeadingMetadataChanges";
import HeadingMetadataChangesEdit from "@salesforce/label/c.HeadingMetadataChangesEdit";

// Import static resources
import EMPTY_IMAGE_02 from '@salesforce/resourceUrl/ImhotepIllustrationEmptyState02';

export default class ImhotepStoryChanges extends LightningElement {

    // set incoming variables
    @api recordId;                              // current page's iab__Story__c recordId
    userId = Id;                                // current user's recordId

    // header variables
    changeRelatedListHeader;                    // used as a header title, including the number of change records
    changeRelatedListHeaderHelp;                // help text that explains how to use the component
    changesRelatedListUrl;                      // used to hold the calculated URL for accessing the full standard related list for stories

    // prep variables for receiving results of Apex methods
    activeMetadata;
    projectId;                                  // stores related Project record Id from wiredProjectId()
    wiredChanges;
    userHasEditAccess = false;                  // controls if user can edit metadata changes in the list
    @track mockChanges = [];                    // holds the mutated list of change records to use in the table, containing miscellaneous values that weren't originally part of the object records
    allChangesRaw = [];
    dataReadyForProcessing = false;             // flag to confirm that the main data wire adapter has run without error
    numChangeCount;                             // total number of records in mockChanges
    hideChangeTable = true;                     // controls whether or not to hide the change table and instead display an empty state illustration card
    
    sortDirectionDefault = 'asc';               // standard default sort direction for unsorted columns
    sortedBy = 'LastModifiedDate';              // initial column the mockChanges data is sorted by, as delivered by getStoryChanges()
    sortDirection = 'desc';                     // initial order the mockChanges is sorted by, as delivered by getStoryChanges()
    sortedByTemp;                               // temporary value used for the actual sort (allows url columns to be sorted by column labels instead)
    
    isLoading = true;                           // initialize as true to display a spinner in the data-table while data is loading

    // define custom labels
    label = {
        ActionDeleteMetadataChangeLabel,
        ActionEditMetadataChangeLabel,
        ActionLogMetadataChangeLabel,
        ActionTableColActionsLabel,
        ChangeEmptyHeading,
        ChangeEmptyText1,
        ChangeEmptyText2,
        ChangeFieldChangeLabel,
        ChangeFieldChangeNotesLabel,
        ChangeFieldChangeTypeLabel,
        ChangeFieldLastModifiedLabel,
        ChangeFieldMetadataComponentLabel,
        ChangeFieldMetadataTypeLabel,
        HeadingMetadataChanges,
        HeadingMetadataChangesEdit,
    }

    // static resource variables
    imageEmptyState02 = EMPTY_IMAGE_02;         // holds the static resource illustration displayed in the empty state of the table

    // data table row-level actions
    actions = [
        { label: this.label.ActionEditMetadataChangeLabel, name: 'EditMetadataChange' },
        { label: this.label.ActionDeleteMetadataChangeLabel, name: 'DeleteMetadataChange' }
    ];
    
    // data table column formatting
    columns = [
        // Col: Change (Name)
        {
            label: this.label.ChangeFieldChangeLabel,
            fieldName: 'Change_URL',
            type: 'url',
            typeAttributes: {
                label: { fieldName: 'Name' }
            },
            initialWidth: 100,
            sortable: true
        },
        
        // Col: Change Type (Change_Type)
        {
            label: this.label.ChangeFieldChangeTypeLabel,
            fieldName: 'Change_Type',
            type: 'text',
            initialWidth: 100,
            sortable: true
        },
        
        // Col: Metadata Component (Metadata_Component/Metadata_Component_URL)
        {
            label: this.label.ChangeFieldMetadataComponentLabel,
            fieldName: 'Metadata_Component_URL',
            type: 'url',
            typeAttributes: {
                label: { fieldName: 'Metadata_Component' }
            },
            initialWidth: 300,
            sortable: true
        },
        
        // Col: Metadata Type (Metadata_Type)
        {
            label: this.label.ChangeFieldMetadataTypeLabel,
            fieldName: 'Metadata_Type',
            type: 'text',
            wrapText: true,
            initialWidth: 140,
            sortable: true
        },
        
        // Col: Change Notes (Change_Notes)
        {
            label: this.label.ChangeFieldChangeNotesLabel,
            fieldName: 'Change_Notes',
            type: 'text',
            wrapText: true,
            initialWidth: 300,
            sortable: true
        },
        
        // Col: Last Modified Date (LastModifiedDate)
        {
            label: this.label.ChangeFieldLastModifiedLabel,
            fieldName: 'LastModifiedDate',
            type: 'date',
            typeAttributes: {
                month: "numeric",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "numeric"
            },
            sortable: true
        },
        
        // Col: Actions
        {
            type: 'action',
            typeAttributes: {
                rowActions: this.actions, menuAlignment: 'auto'
            }
        }
    ];
    
    
    
    // ======================================
    // LIFECYCLE HOOKS
    // ======================================
    
    connectedCallback(){
        // prepare an initial value for the header
        this.changeRelatedListHeader = this.label.HeadingMetadataChanges;
        
        // prepare the URL used in the list header for accessing the full standard related list for changes
        this.changesRelatedListUrl = '/lightning/r/iab__Story__c/' + this.recordId + '/related/iab__Metadata_Component_Changes__r/view';

        // prepare the help text content for the 
        this.changeRelatedListHeaderHelp = this.label.ChangeEmptyText2;
    }



    // ======================================
    // WIRE ADAPTER METHODS
    // ======================================

    // retrieves info about the iab__Metadata_Compoent_Change__c object
    @wire(getObjectInfo, {
        objectApiName: CHANGE_OBJECT
    })
    changeObjectInfo;



    // retrieves active picklist values for the iab__Metadata_Component_Change__c object's iab__Change_Type__c field
    @wire(getPicklistValues, {
        recordTypeId: '$changeObjectInfo.data.defaultRecordTypeId',
        fieldApiName: CHANGE_TYPE_FIELD
    })
    changeTypePicklistValues({ data, error }) {
        if (data) {
            this.changeTypeMap = data.values.map(val => ({
                label: val.label,
                value: val.value
            }));

            // trigger the processing method
            this.processData();
            
        } else if (error) {
            console.error('Error loading the Change Type picklist values for Metadata Component Changes: ', error);
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


    
    // wire the getProjectId() method
    @wire(getProjectId, {
        paramRecordId: '$recordId'
    })
    wiredProjectId({ error, data }) {
        if (data) {
            this.projectId = data;
        } else if (error) {
            console.error('Error retrieving Project Id: ', error);
        }
    }



    // wire the getStoryChanges() method
    @wire(getStoryChanges, {
        paramStoryId: '$recordId'
    })
    wiredChanges(value) {
        // Hold on to the provisioned value so we can refresh it later.
        this.wiredChanges = value; // track the provisioned value
        const { data, error } = value; // destructure the provisioned value
        
        if (data) {
            // store raw data; transformations and translations will happen in processData()
            this.allChangesRaw = data;

            // trigger the processing method
            this.dataReadyForProcessing = true;
            this.processData();
        }
        else if (error) {
            this.dataReadyForProcessing = false;
            this.numChangeCount = 0;
            this.hideChangeTable = true;
            
            // prep the header text to include the number of changes
            this.changeRelatedListHeader = this.label.HeadingMetadataChanges + ' (' + this.numChangeCount + ')';

            console.error('Error retrieving metadata component changes: ', error);
        }
    }



    // ======================================
    // EVENT HANDLER METHODS
    // ======================================
    
    // handles actions for individual Metadata Component Change rows when menu items are clicked
    // related metadata field is:   iab__Metadata_Change_Menu_Actions__c
    // related flow is:             iab__Imhotep_MetadataChange_MenuActions
    handleChangeMenuAction(event) {

        // determine which action to take
        this.selectedAction = event.detail.action.name;
        
        // determine which change was clicked on
        this.selectedChange = event.detail.row.Id;
        
        // open screen flow in a modal window
        const result = ImhotepFlowModal.open({
            size: 'small',
            label: this.label.HeadingMetadataChangesEdit,
            flowAPIName: this.activeMetadata.iab__Metadata_Change_Menu_Actions__c,
            inputVariables: [
                {
                    name: 'recordId',
                    type: 'String',
                    value: this.selectedChange
                },
                {
                    name: 'inputSelectedAction',
                    type: 'String',
                    value: this.selectedAction
                }
            ]
        }).then((result) => {
            refreshApex(this.wiredChanges);
        });
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
    
    
    
    // open flow to log a change to a metadata component when the button is clicked
    // related metadata field is:   iab__Story_Log_Change__c
    // related flow API name is:    iab__Imhotep_Story_LogChange
    openLogChangeFlow(event) {
        const result = ImhotepFlowModal.open({
            size: 'medium',
            label: this.label.ActionLogMetadataChangeLabel,
            flowAPIName: this.activeMetadata.iab__Story_Log_Change__c,
            inputVariables: [
                {
                    name: 'recordId',
                    type: 'String',
                    value: this.recordId
                }
            ]
        }).then((result) => {
            refreshApex(this.wiredChanges);
        });
    }


    
    // ======================================
    // PRIVATE HELPER METHODS
    // ======================================

    // processes data and applies translations once all dependencies are met
    processData() {
        // ensure all data dependencies are met before proceeding
        // check if raw data exists and if changeTypeMap is populated
        if (!this.dataReadyForProcessing || !this.changeTypeMap || this.changeTypeMap.length === 0) {
            // console.log('processMetadataComponentData: Waiting for all data dependencies to be met.');
            this.isLoading = true;      // keep spinner if data is not ready
            return;
        }

        // helper function to get translated Change Type
        const getTranslatedChangeType = (changeTypeValue) => {
            const match = this.changeTypeMap.find(item => item.value === changeTypeValue);
            return match ? match.label : changeTypeValue;       // fallback to original value if no translation found
        };

        // reset
        this.mockChanges = [];

        this.mockChanges = this.allChangesRaw.map(change => ({
            Id: change.Id,
            Name: change.Name,
            Change_URL: '/lightning/r/iab__Metadata_Component_Change__c/' + change.Id + '/view',
            Change_Notes: change.iab__Change_Notes__c,
            Change_Type: getTranslatedChangeType(change.iab__Change_Type__c),
            LastModifiedDate: change.LastModifiedDate,
            Metadata_Component: change.iab__Metadata_Component__r.Name,
            Metadata_Component_URL: '/lightning/r/iab__Metadata_Component__c/' + change.iab__Metadata_Component__c + '/view',
            Metadata_Type: change.iab__Metadata_Type__c
        }));

        this.numChangeCount = this.mockChanges.length;
        if(this.numChangeCount > 0) {
            this.hideChangeTable = false;
        }
        else {
            this.hideChangeTable = true;
        }

        // prep the header text to include the number of changes
        this.changeRelatedListHeader = this.label.HeadingMetadataChanges + ' (' + this.numChangeCount + ')';

        // turn off the data table's loading spinner
        this.isLoading = false;
    }



    // sorts mockData based on the current value of sortedColumn and sortDirection
    // this is a separate method so that it can be called from a handler for a column header click, or separately (not used elsewhere, this is more for future-proofing composability).
    sortData() {
        let sortedData = JSON.parse(JSON.stringify(this.mockChanges));
        
        // Find the column definition for the current sortedBy field
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
        
        sortedData.sort((a, b) => {
            let aVal = (a[this.sortedByTemp] || '').toLowerCase(); // handle blank values and convert to lowercase
            let bVal = (b[this.sortedByTemp] || '').toLowerCase(); // handle blank values and convert to lowercase
            let reverse = this.sortDirection === 'asc' ? 1 : -1;

            if (aVal === '') return 1 * reverse;        // move blank values to the bottom
            if (bVal === '') return -1 * reverse;       // move blank values to the bottom
            return aVal > bVal ? 1 * reverse : aVal < bVal ? -1 * reverse : 0;
        });

        this.mockChanges = sortedData;

        this.sortedByTemp = '';
    }

}