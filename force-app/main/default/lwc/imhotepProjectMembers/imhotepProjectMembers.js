// *******************************************************************************************
// @Name		    imhotepProjectMembers
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date		    01/11/2025
// @Description	    Displays list of Project Members for a Project.
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
import { NavigationMixin } from "lightning/navigation";
import { refreshApex } from '@salesforce/apex';

// import object and field info
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import PROJECT_MEMBER_OBJECT from '@salesforce/schema/Project_Member__c';
import PROJECT_MEMBER_ROLE_FIELD from '@salesforce/schema/Project_Member__c.Role__c';

// import Apex
import getImhotepActiveMetadata from '@salesforce/apex/ImhotepAppBuilderCtrl.getImhotepActiveMetadata';
import getProjectMembers from '@salesforce/apex/ImhotepAppBuilderCtrl.getProjectMembers';

// import components
import ImhotepFlowModal from 'c/imhotepFlowModal';

// Import custom labels
import ActionModifyProjectMemberLabel from "@salesforce/label/c.ActionModifyProjectMemberLabel";
import ActionNewProjectMemberLabel from "@salesforce/label/c.ActionNewProjectMemberLabel";
import ActionRemoveProjectMemberLabel from "@salesforce/label/c.ActionRemoveProjectMemberLabel";
import ActionTableColActionsLabel from "@salesforce/label/c.ActionTableColActionsLabel";
import GeneralModalCloseAltText from "@salesforce/label/c.GeneralModalCloseAltText";
import GeneralModalCloseLabel from "@salesforce/label/c.GeneralModalCloseLabel";
import HeadingProjectMembers from "@salesforce/label/c.HeadingProjectMembers";
import ProjectMemberEmptyHeading from "@salesforce/label/c.ProjectMemberEmptyHeading";
import ProjectMemberEmptyText from "@salesforce/label/c.ProjectMemberEmptyText";
import ProjectMemberFieldNameLabel from "@salesforce/label/c.ProjectMemberFieldNameLabel";
import ProjectMemberFieldNotesLabel from "@salesforce/label/c.ProjectMemberFieldNotesLabel";
import ProjectMemberFieldRoleLabel from "@salesforce/label/c.ProjectMemberFieldRoleLabel";

// import static resources
import EMPTY_IMAGE_02 from '@salesforce/resourceUrl/ImhotepIllustrationEmptyState02';

export default class ImhotepProjectMembers extends NavigationMixin(LightningElement) {
    
    // set incoming variables
    @api recordId;                              // current page's iab__Project__c recordId

    projectMemberRoleMap = [];                      // stores a value-to-label mapping for translation of the Project Member iab__Role__c picklist

    // header variables
    tableHeader;                                // used as a header title, including the number of project members
    tableHeaderUrl;                             // used to hold the calculated URL for accessing the full standard related list for project members

    // prep variables for receiving results of Apex methods
    activeMetadata;                             // holds the active iab__Imhotep_Config__mdt metadata record

    wiredProjectMembers;                        // holds the wired result for refreshApex
    @track mockMembers = [];                    // holds the mutated list of project member records to use in the table, containing miscellaneous values that weren't part of the object records
    allMembersRaw = [];
    dataReadyForProcessing = false;             // flag to confirm that the main data wire adapter has run without error
    recordCount;                                // total number of project member records returned
    showEmptyState = false;                     // controls whether or not to hide the data table and instead display an empty state illustration card
    
    sortDirectionDefault = 'asc';               // standard default sort direction for unsorted columns
    sortedBy = 'Project_Member_Name';           // initial sort column
    sortDirection = 'desc';                     // initial sort order
    sortedByTemp;                               // temporary value used for the actual sort (allows url columns to be sorted by column labels instead)

    isLoading = true;                           // initialize as true to display a spinner in the data-table while data is loading
    
    // define custom labels
    label = {
        ActionModifyProjectMemberLabel,
        ActionNewProjectMemberLabel,
        ActionRemoveProjectMemberLabel,
        ActionTableColActionsLabel,
        GeneralModalCloseAltText,
        GeneralModalCloseLabel,
        HeadingProjectMembers,
        ProjectMemberEmptyHeading,
        ProjectMemberEmptyText,
        ProjectMemberFieldNameLabel,
        ProjectMemberFieldNotesLabel,
        ProjectMemberFieldRoleLabel,
    };

    // static resource variables
    imageEmptyState02 = EMPTY_IMAGE_02;         // holds the static resource illustration displayed in the empty state of the table

    // data table row-level actions
    actions = [
        { label: this.label.ActionModifyProjectMemberLabel, name: 'EditProjectMember' },
        { label: this.label.ActionRemoveProjectMemberLabel, name: 'DeleteProjectMember' }
    ];
    
    // data table column formatting
    columns = [
        // Col: Project Member
        {
            label: this.label.ProjectMemberFieldNameLabel,
            fieldName: 'Project_Member_URL',
            type: 'url',
            typeAttributes: {
                label: { fieldName: 'Project_Member_Name' }
            },
            wrapText: true,
            initialWidth: 300,
            sortable: true
        },
        
        // Col: Role
        {
            label: this.label.ProjectMemberFieldRoleLabel,
            fieldName: 'Role',
            type: 'text',
            initialWidth: 150,
            sortable: true
        },
        
        // Col: Notes
        {
            label: this.label.ProjectMemberFieldNotesLabel,
            fieldName: 'Notes',
            type: 'text',
            wrapText: true,
            sortable: true
        },
        
        // Col: Actions
        {
            type: 'action',
            typeAttributes: {
                rowActions: this.getRowActions.bind(this), menuAlignment: 'auto'
            }
        }
    ];



    // ======================================
    // LIFECYCLE HOOKS
    // ======================================

    connectedCallback(){
        // prepare an initial value for the header
        this.tableHeader = this.label.HeadingProjectMembers;
        
        // prepare the URL used in the list header for accessing the full standard related list for project members
        this.tableHeaderUrl = '/lightning/r/iab__Project__c/' + this.recordId + '/related/iab__Project_Members__r/view';
    }



    // ======================================
    // WIRE ADAPTER METHODS
    // ======================================

    // retrieves info about the iab__Project_Member__c object
    @wire(getObjectInfo, {
        objectApiName: PROJECT_MEMBER_OBJECT
    })
    projectMemberObjectInfo;



    // retrieves active picklist values for the iab__Project_Member__c object's iab__Role__c field
    @wire(getPicklistValues, {
        recordTypeId: '$projectMemberObjectInfo.data.defaultRecordTypeId',
        fieldApiName: PROJECT_MEMBER_ROLE_FIELD
    })
    projectMemberRolePicklistValues({ data, error }) {
        if (data) {
            this.projectMemberRoleMap = data.values.map(val => ({
                label: val.label,
                value: val.value
            }));

            // trigger the processing method
            this.processData();
            
        } else if (error) {
            console.error('Error loading Project Member Role picklist values:', error);
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



    // wire the getProjectMembers() method
    @wire(getProjectMembers, {
        ParamProjectId: '$recordId'
    })
    wiredProjectMembers(result) {
        this.wiredProjectMembers = result;
        const { data, error } = result;

        if (data) {
            // reset
            this.recordCount = 0;
            this.mockMembers = [];

            // store raw data; transformations and translations will happen in processData()
            this.allMembersRaw = data;

            // trigger the processing method
            this.dataReadyForProcessing = true;
            this.processData();

        } else if (error) {
            this.dataReadyForProcessing = false;
            this.recordCount = 0;
            this.showEmptyState = true;
            this.isLoading = false;

            // prep the header text to include the number of project members
            this.tableHeader = this.label.HeadingProjectMembers + ' (' + this.recordCount + ')';

            console.error('Error retrieving project members: ', error);
        }
    }



    // ======================================
    // EVENT HANDLER METHODS
    // ======================================
    
    // handles actions for individual Project Member rows when menu items are clicked
    // related metadata fields are: iab__Project_Update_Project_Member__c (for edit)
    //                              iab__Project_Delete_Project_Member__c (for delete)
    // related flows are:           iab__Imhotep_ProjectMember_Update (for edit)
    //                              iab__Imhotep_ProjectMember_Delete (for delete)
    handleMenuAction(event) {

        // determine which action to take
        this.selectedAction = event.detail.action.name;
        
        // determine which row was clicked on
        this.selectedRow = event.detail.row.Id;

        switch (this.selectedAction) {
            case 'EditProjectMember':
                this.selectedLabel = this.label.ActionModifyProjectMemberLabel;
                this.selectedFlowAPIName = this.activeMetadata.iab__Project_Update_Project_Member__c;
                this.openFlowModal = true;
                break;

            case 'DeleteProjectMember':
                this.selectedLabel = this.label.ActionRemoveProjectMemberLabel;
                this.selectedFlowAPIName = this.activeMetadata.iab__Project_Delete_Project_Member__c;
                this.openFlowModal = true;
                break;
            
            default:
                this.openFlowModal = false;
                break;
        }

        // console.log('selectedAction = ' + this.selectedAction);
        // console.log('selectedRow = ' + this.selectedRow);
        // console.log('selectedLabel = ' + this.selectedLabel);
        // console.log('selectedFlowAPIName = ' + this.selectedFlowAPIName);
        
        if(this.openFlowModal) {
            // open screen flow in a modal window
            const result = ImhotepFlowModal.open({
                size: 'small',
                label: this.selectedLabel,
                flowAPIName: this.selectedFlowAPIName,
                inputVariables: [
                    {
                        name: 'recordId',
                        type: 'String',
                        value: this.selectedRow
                    }
                ]
            }).then((result) => {
                refreshApex(this.wiredProjectMembers);
            });
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



    // open flow to create a project member when the button is clicked
    // related metadata field is:   iab__Project_New_Project_Member__c
    // related flow API name is:    iab__Imhotep_Project_NewProjectMember
    openNewProjectMemberFlow(event) {
        const result = ImhotepFlowModal.open({
            size: 'medium',
            label: this.label.ActionNewProjectMemberLabel,
            flowAPIName: this.activeMetadata.iab__Project_New_Project_Member__c,
            inputVariables: [
                {
                    name: 'recordId',
                    type: 'String',
                    value: this.recordId
                }
            ]
        }).then((result) => {
            refreshApex(this.wiredProjectMembers);
        });
    }



    // ======================================
    // PRIVATE HELPER METHODS
    // ======================================

    getRowActions(row, doneCallback) {
        const actions = [
            { label: this.label.ActionModifyProjectMemberLabel, name: 'EditProjectMember' }
        ];
        if (row.Role !== 'Owner/Lead') {
            actions.push({
                label: this.label.ActionRemoveProjectMemberLabel,
                name: 'DeleteProjectMember'
            });
        }
        // simulate async processing with a timeout
        setTimeout(() => {
            doneCallback(actions);
        }, 200);
    }



    // processes data and applies translations once all dependencies are met
    processData() {
        // ensure all data dependencies are met before proceeding
        // check if raw data exists and if the projectMemberRoleMap is populated
        if (!this.dataReadyForProcessing || !this.projectMemberRoleMap || this.projectMemberRoleMap.length === 0) {
            // console.log('processData: Waiting for all data dependencies to be met.');
            this.isLoading = true;      // keep spinner if data is not ready
            return;
        }

        // helper function to get translated Project Member Role
        const getTranslatedProjectMemberRole = (roleValue) => {
            const match = this.projectMemberRoleMap.find(item => item.value === roleValue);
            return match ? match.label : roleValue;       // fallback to original value if no translation found
        };

        this.mockMembers = this.allMembersRaw.map(member => ({
            Id: member.Id,
            Project_Member_Name: member.iab__User__r.FirstName ? member.iab__User__r.FirstName + ' ' + member.iab__User__r.LastName : member.iab__User__r.LastName,
            Project_Member_URL: '/lightning/r/iab__Project_Member__c/' + member.Id + '/view',
            Role: getTranslatedProjectMemberRole(member.iab__Role__c),
            Notes: member.iab__Notes__c
        }));

        this.recordCount = + this.mockMembers.length;
        if(this.recordCount > 0) {
            this.showEmptyState = false;
        }
        else {
            this.showEmptyState = true;
        }

        // prep the header text to include the number of project members
        this.tableHeader = this.label.HeadingProjectMembers + ' (' + this.recordCount + ')';

        this.isLoading = false;
    }



    // sorts allReleases based on the current value of sortedColumn and sortDirection
    // this is a separate method so that it can be called from a handler for a column
    // header click, or separately (not used elsewhere, this is more for
    // future-proofing composability).
    sortData() {
        let sortedData = JSON.parse(JSON.stringify(this.mockMembers));
        
        // Find the column definition for the current sortedBy field
        const column = this.columns.find(col => col.fieldName === this.sortedBy);

        // set the sortedBy value to use during the sort;
        // if the column's data type is 'url',
        // set sortedByTemp to the typeAttributes label fieldName instead
        // else set sortedByTemp to sortedBy
        // because these columns should be sorted by the label, not the url
        if (column && column.type === 'url') {
            this.sortedByTemp = column.typeAttributes.label.fieldName;
        } else {
            this.sortedByTemp = this.sortedBy;
        }
        
        sortedData.sort((a, b) => {
            let aVal = (a[this.sortedByTemp] || '').toLowerCase(); // Handle blank values and convert to lowercase
            let bVal = (b[this.sortedByTemp] || '').toLowerCase(); // Handle blank values and convert to lowercase
            let reverse = this.sortDirection === 'asc' ? 1 : -1;

            if (aVal === '') return 1 * reverse;        // Move blank values to the bottom
            if (bVal === '') return -1 * reverse;       // Move blank values to the bottom
            return aVal > bVal ? 1 * reverse : aVal < bVal ? -1 * reverse : 0;
        });

        this.mockMembers = sortedData;

        this.sortedByTemp = '';
    }

}