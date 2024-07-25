// *******************************************************************************************
// @Name		    imhotepReleaseChanges
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date		    06/18/2024
// @Description	    LWC displays Metadata Component Changes related to a Release's Stories.
// *******************************************************************************************
// COPYRIGHT AND LICENSE
// Copyright (c) 2023, Salesforce, Inc.
// SPDX-License-Identifier: Apache-2
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// *******************************************************************************************
// MODIFICATION LOG
// Date			Developer		Story		Description
// 07/24/2024   Mitch Lynch     S000093     Created base component.
// *******************************************************************************************
// NOTES
// Lightning Datatable LWC documentation: https://developer.salesforce.com/docs/component-library/bundle/lightning-datatable/documentation
// *******************************************************************************************

import { LightningElement, api, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import Id from "@salesforce/user/Id";

// import custom labels
import ActionDeleteMetadataChangeLabel from "@salesforce/label/c.ActionDeleteMetadataChangeLabel";
import ActionEditMetadataChangeLabel from "@salesforce/label/c.ActionEditMetadataChangeLabel";
import ActionTableColActionsLabel from "@salesforce/label/c.ActionTableColActionsLabel";
import ChangeEmptyHeading from "@salesforce/label/c.ChangeEmptyHeading";
import ChangeEmptyText1 from "@salesforce/label/c.ChangeEmptyText1";
import ChangeEmptyText2 from "@salesforce/label/c.ChangeEmptyText2";
import ChangeEmptyText4 from "@salesforce/label/c.ChangeEmptyText4";
import ChangeFieldChangeLabel from "@salesforce/label/c.ChangeFieldChangeLabel";
import ChangeFieldChangeNotesLabel from "@salesforce/label/c.ChangeFieldChangeNotesLabel";
import ChangeFieldChangeTypeLabel from "@salesforce/label/c.ChangeFieldChangeTypeLabel";
import ChangeFieldLastModifiedLabel from "@salesforce/label/c.ChangeFieldLastModifiedLabel";
import ChangeFieldMetadataComponentLabel from "@salesforce/label/c.ChangeFieldMetadataComponentLabel";
import ChangeFieldMetadataTypeLabel from "@salesforce/label/c.ChangeFieldMetadataTypeLabel";
import ChangeFieldStoryLabel from "@salesforce/label/c.ChangeFieldStoryLabel";
import ChangeFieldStoryStatusLabel from "@salesforce/label/c.ChangeFieldStoryStatusLabel";
import HeadingMetadataChanges from "@salesforce/label/c.HeadingMetadataChanges";
import HeadingMetadataChangesEdit from "@salesforce/label/c.HeadingMetadataChangesEdit";

// import Apex
import getImhotepActiveMetadata from '@salesforce/apex/ImhotepAppBuilderCtrl.getImhotepActiveMetadata';
import getReleaseChanges from '@salesforce/apex/ImhotepAppBuilderCtrl.getReleaseChanges';
import ImhotepFlowModal from 'c/imhotepFlowModal';

// Import static resources
import EMPTY_IMAGE_02 from '@salesforce/resourceUrl/ImhotepIllustrationEmptyState02';

export default class ImhotepReleaseChanges extends LightningElement {

    // define custom labels
    label = {
        ActionDeleteMetadataChangeLabel,
        ActionEditMetadataChangeLabel,
        ActionTableColActionsLabel,
        ChangeEmptyHeading,
        ChangeEmptyText1,
        ChangeEmptyText2,
        ChangeEmptyText4,
        ChangeFieldChangeLabel,
        ChangeFieldChangeNotesLabel,
        ChangeFieldChangeTypeLabel,
        ChangeFieldLastModifiedLabel,
        ChangeFieldMetadataComponentLabel,
        ChangeFieldMetadataTypeLabel,
        ChangeFieldStoryLabel,
        ChangeFieldStoryStatusLabel,
        HeadingMetadataChanges,
        HeadingMetadataChangesEdit,
    }

    // set incoming variables
    @api recordId;                              // current page's iab__Release__c recordId
    userId = Id;                                // current user's recordId

    // static resource variables
    imageEmptyState02 = EMPTY_IMAGE_02;         // holds the static resource illustration displayed in the empty state of the table

    // header variables
    changeRelatedListHeader;                    // used as a header title, including the number of change records
    changeRelatedListHeaderHelp;                // help text that explains how to use the component
    changesRelatedListUrl;                      // used to hold the calculated URL for accessing the full standard related list for stories

    // prep variables for receiving results of Apex methods
    activeMetadata;
    wiredChanges;
    userHasEditAccess = false;                  // controls if user can edit metadata changes in the list
    mockChanges = [];                           // holds the mutated list of change records to use in the table, containing miscellaneous values that weren't originally part of the object records
    numChangeCount;                             // total number of records in mockChanges
    hideChangeTable = true;                     // controls whether or not to hide the change table and instead display an empty state illustration card
    
    sortDirectionDefault = 'asc';               // standard default sort direction for unsorted columns
    sortedBy = 'LastModifiedDate';              // initial column the mockChanges data is sorted by, as delivered by getStoryChanges()
    sortDirection = 'desc';                     // initial order the mockChanges is sorted by, as delivered by getStoryChanges()
    sortedByTemp;                               // temporary value used for the actual sort (allows url columns to be sorted by column labels instead)
    
    isLoading = true;                           // initialize as true to display a spinner in the data-table while data is loading

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
            initialWidth: 400,
            sortable: true
        },
        
        // Col: Story (Story)
        {
            label: this.label.ChangeFieldStoryLabel,
            fieldName: 'Story_URL',
            type: 'url',
            typeAttributes: {
                label: { fieldName: 'Story' }
            },
            wrapText: true,
            initialWidth: 400,
            sortable: true
        },
        
        // Col: Story Status (Story_Status)
        {
            label: this.label.ChangeFieldStoryStatusLabel,
            fieldName: 'Story_Status',
            type: 'text',
            wrapText: true,
            initialWidth: 140,
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
    
    
    
    connectedCallback(){
        // prepare an initial value for the header
        this.changeRelatedListHeader = this.label.HeadingMetadataChanges;
        
        // prepare the URL used in the list header for accessing the full standard related list for changes
        this.changesRelatedListUrl = '/lightning/r/iab__Release__c/' + this.recordId + '/related/iab__Metadata_Component_Changes__r/view';

        // prepare the help text content for the 
        this.changeRelatedListHeaderHelp = this.label.ChangeEmptyText2 + ' ' + this.label.ChangeEmptyText4;
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



    // wire the getReleaseChanges() method
    @wire(getReleaseChanges, {paramReleaseId: '$recordId'})
        wiredChanges(value) {
            // Hold on to the provisioned value so we can refresh it later.
            this.wiredChanges = value; // track the provisioned value
            const { data, error } = value; // destructure the provisioned value
            
            if (data) {
                this.mockChanges = [];
                data.forEach((change) => {
                    this.mockChanges.push({
                        Id: change.Id,
                        Name: change.Name,
                        Change_URL: '/lightning/r/iab__Metadata_Component_Change__c/' + change.Id + '/view',
                        Change_Notes: change.iab__Change_Notes__c,
                        Change_Type: change.iab__Change_Type__c,
                        LastModifiedDate: change.LastModifiedDate,
                        Metadata_Component: change.iab__Metadata_Component__r.Name,
                        Metadata_Component_URL: '/lightning/r/iab__Metadata_Component__c/' + change.iab__Metadata_Component__c + '/view',
                        Metadata_Type: change.iab__Metadata_Type__c,
                        Story: change.iab__Story__r.iab__Story_Number__c + ': ' + change.iab__Story__r.Name,
                        Story_URL: '/lightning/r/iab__Story__c/' + change.iab__Story__c + '/view',
                        Story_Status: change.iab__Story__r.iab__Status__c
                    })
                });

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
            else if (error) {
                this.numChangeCount = 0;
                this.hideChangeTable = true;
                
                // prep the header text to include the number of changes
                this.changeRelatedListHeader = this.label.HeadingMetadataChanges + ' (' + this.numChangeCount + ')';

                console.error('Error retrieving metadata component changes: ', error);
            }
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


    
    // sorts mockData based on the current value of sortedColumn and sortDirection
    // this is a separate method so that it can be called from a handler for a column header click, or separately (not used elsewhere, this is more for future-proofing composability).
    sortData() {
        let sortedData = JSON.parse(JSON.stringify(this.mockChanges));
        
        /* OLD CODE TO MANUALLY DESIGNATE URL COLUMNS, NOT IN USE
        // set the sortedBy value to use during the sort;
        // sortedByTemp = sortedBy unless the sort is for a column with a url data type
        // because these columns should be shorted by the label, not the url
        switch(this.sortedBy) {
            case 'Change_URL': this.sortedByTemp = 'Name'; break;
            case 'Metadata_Component_URL': this.sortedByTemp = 'Metadata_Component'; break;
            default: this.sortedByTemp = this.sortedBy;
        }
        */

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
            let aVal = a[this.sortedByTemp] || ''; // Handle blank values
            let bVal = b[this.sortedByTemp] || ''; // Handle blank values
            let reverse = this.sortDirection === 'asc' ? 1 : -1;

            /* OLD CODE THAT SORTED WITH BLANK VALUES AT THE TOP
            return aVal > bVal ? 1 * reverse : aVal < bVal ? -1 * reverse : 0;
            */
            if (aVal === '') return 1 * reverse;        // Move blank values to the bottom
            if (bVal === '') return -1 * reverse;       // Move blank values to the bottom
            return aVal > bVal ? 1 * reverse : aVal < bVal ? -1 * reverse : 0;
        });

        this.mockChanges = sortedData;

        this.sortedByTemp = '';
    }



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
            // if modal closed with X button, promise returns result = 'undefined'
            // if modal closed with OK button, promise returns result = 'okay'
            // if modal closed when a flow finishes, promise returns result = 'okay'
            refreshApex(this.wiredChanges);
        });
    }

}