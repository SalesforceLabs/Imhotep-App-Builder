// *******************************************************************************************
// @Name		    imhotepReleaseList
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date		    08/02/2024
// @Description	    LWC used to display Releases for a given Project; replaces devProjectReleases Aura component.
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
import RELEASE_OBJECT from '@salesforce/schema/Release__c';
import RELEASE_STATUS_FIELD from '@salesforce/schema/Release__c.Status__c';

// import Apex
import getImhotepActiveMetadata from '@salesforce/apex/ImhotepAppBuilderCtrl.getImhotepActiveMetadata';
import getReleaseLists from '@salesforce/apex/ImhotepAppBuilderCtrl.getReleaseLists';

// import components
import ImhotepFlowModal from 'c/imhotepFlowModal';

// Import custom labels
import ActionNewReleaseLabel from "@salesforce/label/c.ActionNewReleaseLabel";
import ActionNewReleaseFromTemplateLabel from "@salesforce/label/c.ActionNewReleaseFromTemplateLabel";
import ActionRefreshReleasesAlt from "@salesforce/label/c.ActionRefreshReleasesAlt";
import ActionRefreshReleasesLabel from "@salesforce/label/c.ActionRefreshReleasesLabel";
import HeadingProjectReleases from "@salesforce/label/c.HeadingProjectReleases";
import HeadingReleaseListHelp from "@salesforce/label/c.HeadingReleaseListHelp";
import ReleaseEmptyHeading from "@salesforce/label/c.ReleaseEmptyHeading";
import ReleaseEmptyText from "@salesforce/label/c.ReleaseEmptyText";
import ReleaseFieldDescriptionLabel from "@salesforce/label/c.ReleaseFieldDescriptionLabel";
import ReleaseFieldIsBacklogLabel from "@salesforce/label/c.ReleaseFieldIsBacklogLabel";
import ReleaseFieldIsBacklogIconTitle from "@salesforce/label/c.ReleaseFieldIsBacklogIconTitle";
import ReleaseFieldNameLabel from "@salesforce/label/c.ReleaseFieldNameLabel";
import ReleaseFieldReleaseDateLabel from "@salesforce/label/c.ReleaseFieldReleaseDateLabel";
import ReleaseFieldStatusAccepted from "@salesforce/label/c.ReleaseFieldStatusAccepted";
import ReleaseFieldStatusActive from "@salesforce/label/c.ReleaseFieldStatusActive";
import ReleaseFieldStatusLabel from "@salesforce/label/c.ReleaseFieldStatusLabel";
import ReleaseFieldStatusPlanning from "@salesforce/label/c.ReleaseFieldStatusPlanning";

// import static resources
import EMPTY_IMAGE_02 from '@salesforce/resourceUrl/ImhotepIllustrationEmptyState02';

export default class ImhotepReleaseList extends NavigationMixin(LightningElement) {

    // set incoming variables
    @api recordId;                              // current page's iab__Project__c recordId

    releaseStatusMap = [];                      // stores a value-to-label mapping for translation of the Release iab__Status__c picklist

    // header variables
    releaseRelatedListHeader;                   // used as a header title, including the number of releases
    releaseRelatedListUrl;                      // used to hold the calculated URL for accessing the full standard related list for releases

    // prep variables for receiving results of Apex methods
    activeMetadata;                             // holds the active iab__Imhotep_Config__mdt metadata record

    wiredReleaseListsResult;                    // holds the wired result for refreshApex
    @track planningReleases = [];               // mutated list of releases where Status = Planning (and not backlog)
    @track activeReleases = [];                 // mutated list of releases where Status = Active (and not backlog)
    @track acceptedReleases = [];               // mutated list of releases where Status = Accepted (and not backlog)
    @track backlogReleases = [];                // mutated list of all backlog releases
    @track allReleases = [];                    // mutated list of all releases
    planningReleasesRaw = [];
    activeReleasesRaw = [];
    acceptedReleasesRaw = [];
    backlogReleasesRaw = [];
    allReleasesRaw = [];
    dataReadyForProcessing = false;             // flag to confirm that the main data wire adapter has run without error
    numReleaseCount;                            // total number of release records returned
    hideReleases = true;                        // controls whether or not to hide the accepted release table and instead display an empty state illustration card
    
    sortDirectionDefault = 'asc';               // standard default sort direction for unsorted columns
    sortedBy = 'Release_Date';                  // initial sort column for allReleases data
    sortDirection = 'desc';                     // initial sort order for allReleases data
    sortedByTemp;                               // temporary value used for the actual sort (allows url columns to be sorted by column labels instead)

    isLoading = true;                           // initialize as true to display a spinner in the data-table while data is loading

    // define custom labels
    label = {
        ActionNewReleaseFromTemplateLabel,
        ActionNewReleaseLabel,
        ActionRefreshReleasesAlt,
        ActionRefreshReleasesLabel,
        HeadingProjectReleases,
        HeadingReleaseListHelp,
        ReleaseEmptyHeading,
        ReleaseEmptyText,
        ReleaseFieldDescriptionLabel,
        ReleaseFieldIsBacklogIconTitle,
        ReleaseFieldIsBacklogLabel,
        ReleaseFieldNameLabel,
        ReleaseFieldReleaseDateLabel,
        ReleaseFieldStatusAccepted,
        ReleaseFieldStatusActive,
        ReleaseFieldStatusPlanning,
        ReleaseFieldStatusLabel,
    };

    // static resource variables
    imageEmptyState02 = EMPTY_IMAGE_02;         // holds the static resource illustration displayed in the empty state of the table

    

    // data table column formatting
    columns = [
        // Col: Release
        {
            label: this.label.ReleaseFieldNameLabel,
            fieldName: 'Release_URL',
            type: 'url',
            typeAttributes: {
                label: { fieldName: 'Name' }
            },
            wrapText: true,
            initialWidth: 300,
            sortable: true
        },
        
        // Col: Is Backlog?
        {
            label: this.label.ReleaseFieldIsBacklogLabel,
            fieldName: 'Is_Backlog',
            type: 'boolean',
            initialWidth: 100,
            sortable: true
        },
        
        // Col: Status
        {
            label: this.label.ReleaseFieldStatusLabel,
            fieldName: 'Status',
            type: 'text',
            initialWidth: 150,
            sortable: true
        },
        
        // Col: Release Date
        {
            label: this.label.ReleaseFieldReleaseDateLabel,
            fieldName: 'Release_Date',
            type: 'date-local',
            typeAttributes: {
                month: "numeric",
                day: "numeric",
                year: "numeric"
            },
            wrapText: true,
            initialWidth: 150,
            sortable: true
        },
        
        // Col: Description
        {
            label: this.label.ReleaseFieldDescriptionLabel,
            fieldName: 'Description',
            type: 'text',
            wrapText: true,
            sortable: true
        }
    ];
    

    
    // ======================================
    // LIFECYCLE HOOKS
    // ======================================

    connectedCallback(){
        // prepare an initial value for the header
        this.releaseRelatedListHeader = this.label.HeadingProjectReleases;
        
        // prepare the URL used in the list header for accessing the full standard related list for releases
        this.releaseRelatedListUrl = '/lightning/r/iab__Project__c/' + this.recordId + '/related/iab__Releases__r/view';
    }



    // ======================================
    // WIRE ADAPTER METHODS
    // ======================================
    
    // retrieves info about the iab__Release__c object
    @wire(getObjectInfo, {
        objectApiName: RELEASE_OBJECT
    })
    releaseObjectInfo;



    // retrieves active picklist values for the iab__Release__c object's iab__Status__c field
    @wire(getPicklistValues, {
        recordTypeId: '$releaseObjectInfo.data.defaultRecordTypeId',
        fieldApiName: RELEASE_STATUS_FIELD
    })
    releaseStatusPicklistValues({ data, error }) {
        if (data) {
            this.releaseStatusMap = data.values.map(val => ({
                label: val.label,
                value: val.value
            }));

            // trigger the processing method
            this.processData();
            
        } else if (error) {
            console.error('Error loading Release Status picklist values:', error);
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



    // wire the getReleaseLists() method
    @wire(getReleaseLists, {
        ParamProjectId: '$recordId'
    })
    wiredReleaseLists(result) {
        this.wiredReleaseListsResult = result;
        const { data, error } = result;

        if (data) {
            // reset
            this.numReleaseCount = 0;
            this.planningReleases = [];
            this.activeReleases = [];
            this.acceptedReleases = [];
            this.backlogReleases = [];
            this.allReleases = [];

            // process the returned list of lists
            const [planning, active, accepted, backlog, all] = data;

            // store raw data; transformations and translations will happen in processData()
            this.planningReleasesRaw = planning;
            this.activeReleasesRaw = active;
            this.acceptedReleasesRaw = accepted;
            this.backlogReleasesRaw = backlog;
            this.allReleasesRaw = all;

            // trigger the processing method
            this.dataReadyForProcessing = true;
            this.processData();

        } else if (error) {
            this.dataReadyForProcessing = false;
            this.numReleaseCount = 0;
            this.hideReleases = true;

            // prep the header text to include the number of releases
            this.releaseRelatedListHeader = this.label.HeadingProjectReleases + ' (' + this.numReleaseCount + ')';

            console.error('Error retrieving releases: ', error);
        }
    }



    // ======================================
    // EVENT HANDLER METHODS
    // ======================================

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



    // open flow to create a release from a template when the button is clicked
    // related metadata field is:   iab__Project_Create_Release_from_Template__c
    // related flow API name is:    iab__Imhotep_Project_CreateReleaseFromTemplate
    openCreateReleaseFromTemplateFlow(event) {
        const result = ImhotepFlowModal.open({
            size: 'medium',
            label: this.label.ActionNewReleaseFromTemplateLabel,
            flowAPIName: this.activeMetadata.iab__Project_Create_Release_from_Template__c,
            inputVariables: [
                {
                    name: 'recordId',
                    type: 'String',
                    value: this.recordId
                }
            ]
        }).then((result) => {
            // if modal closed with X button, promise returns result = 'undefined'
            // if modal closed with OK button, promise returns result = 'okay'
            // if modal closed when a flow finishes, promise returns result = 'okay'
            refreshApex(this.wiredReleaseListsResult);
        });
    }
    
    
    
    // open flow to create a release when the button is clicked
    // related metadata field is:   iab__Project_New_Release__c
    // related flow API name is:    iab__Imhotep_Project_NewRelease
    openNewReleaseFlow(event) {
        const result = ImhotepFlowModal.open({
            size: 'medium',
            label: this.label.ActionNewReleaseLabel,
            flowAPIName: this.activeMetadata.iab__Project_New_Release__c,
            inputVariables: [
                {
                    name: 'recordId',
                    type: 'String',
                    value: this.recordId
                }
            ]
        }).then((result) => {
            // if modal closed with X button, promise returns result = 'undefined'
            // if modal closed with OK button, promise returns result = 'okay'
            // if modal closed when a flow finishes, promise returns result = 'okay'
            refreshApex(this.wiredReleaseListsResult);
        });
    }



    // handle navigation to a release record when a shortcut tile is clicked
    openRelease(event) {
        const selectedReleaseId = event.currentTarget.dataset.release;
        
        this[NavigationMixin.Navigate]({
          type: "standard__recordPage",
          attributes: {
            recordId: selectedReleaseId,
            objectApiName: "iab__Release__c",
            actionName: "view",
          },
        });
    }


    
    // ======================================
    // PRIVATE HELPER METHODS
    // ======================================

    // processes data and applies translations once all dependencies are met
    processData() {
        // ensure all data dependencies are met before proceeding
        // check if raw data exists and if the releaseStatusMap is populated
        if (!this.dataReadyForProcessing || !this.releaseStatusMap || this.releaseStatusMap.length === 0) {
            // console.log('processData: Waiting for all data dependencies to be met.');
            this.isLoading = true;      // keep spinner if data is not ready
            return;
        }

        // helper function to get translated Release Status
        const getTranslatedReleaseStatus = (statusValue) => {
            const match = this.releaseStatusMap.find(item => item.value === statusValue);
            return match ? match.label : statusValue;       // fallback to original value if no translation found
        };
        
        // transform and translate all release lists

        this.planningReleases = this.planningReleasesRaw.map(rel => ({
            Id: rel.Id,
            Release_URL: '/lightning/r/iab__Release__c/' + rel.Id + '/view',
            Name: rel.Name,
            Status: getTranslatedReleaseStatus(rel.iab__Status__c),
            Is_Backlog: rel.iab__Is_Backlog__c,
            Release_Date: rel.iab__Release_Date__c,
            Description: rel.iab__Description__c
        }));

        this.activeReleases = this.activeReleasesRaw.map(rel => ({
            Id: rel.Id,
            Release_URL: '/lightning/r/iab__Release__c/' + rel.Id + '/view',
            Name: rel.Name,
            Status: getTranslatedReleaseStatus(rel.iab__Status__c),
            Is_Backlog: rel.iab__Is_Backlog__c,
            Release_Date: rel.iab__Release_Date__c,
            Description: rel.iab__Description__c
        }));

        this.acceptedReleases = this.acceptedReleasesRaw.map(rel => ({
            Id: rel.Id,
            Release_URL: '/lightning/r/iab__Release__c/' + rel.Id + '/view',
            Name: rel.Name,
            Status: getTranslatedReleaseStatus(rel.iab__Status__c),
            Is_Backlog: rel.iab__Is_Backlog__c,
            Release_Date: rel.iab__Release_Date__c,
            Description: rel.iab__Description__c
        }));

        this.backlogReleases = this.backlogReleasesRaw.map(rel => ({
            Id: rel.Id,
            Release_URL: '/lightning/r/iab__Release__c/' + rel.Id + '/view',
            Name: rel.Name,
            Status: getTranslatedReleaseStatus(rel.iab__Status__c),
            Is_Backlog: rel.iab__Is_Backlog__c,
            Release_Date: rel.iab__Release_Date__c,
            Description: rel.iab__Description__c
        }));

        this.allReleases = this.allReleasesRaw.map(rel => ({
            Id: rel.Id,
            Release_URL: '/lightning/r/iab__Release__c/' + rel.Id + '/view',
            Name: rel.Name,
            Status: getTranslatedReleaseStatus(rel.iab__Status__c),
            Is_Backlog: rel.iab__Is_Backlog__c,
            Release_Date: rel.iab__Release_Date__c,
            Description: rel.iab__Description__c
        }));

        this.numReleaseCount = + this.planningReleases.length + this.activeReleases.length + this.acceptedReleases.length + this.backlogReleases.length;
        if(this.numReleaseCount > 0) {
            this.hideReleases = false;
        }
        else {
            this.hideReleases = true;
        }

        // prep the header text to include the number of releases
        this.releaseRelatedListHeader = this.label.HeadingProjectReleases + ' (' + this.numReleaseCount + ')';

        this.isLoading = false; // only hide spinner when all processing is done
    }



    // refreshes the data when the refresh icon button is clicked
    refreshList() {
        refreshApex(this.wiredReleaseListsResult);
    }



    // sorts allReleases based on the current value of sortedColumn and sortDirection
    // this is a separate method so that it can be called from a handler for a column
    // header click, or separately (not used elsewhere, this is more for
    // future-proofing composability).
    sortData() {
        let sortedData = JSON.parse(JSON.stringify(this.allReleases));
        
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

        this.allReleases = sortedData;

        this.sortedByTemp = '';
    }

}