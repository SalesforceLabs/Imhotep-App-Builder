// *******************************************************************************************
// @Name		    imhotepMyProjects
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date		    07/21/2025
// @Description	    LWC displays a tabbed list of all the user's Projects and their key Releases.
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

import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';

// import object and field info
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import PROJECT_OBJECT from '@salesforce/schema/Project__c';
import PROJECT_STATUS_FIELD from '@salesforce/schema/Project__c.Status__c';
import PROJECT_TYPE_FIELD from '@salesforce/schema/Project__c.Type__c';
import RELEASE_OBJECT from '@salesforce/schema/Release__c';
import RELEASE_STATUS_FIELD from '@salesforce/schema/Release__c.Status__c';

// import Apex
import getImhotepActiveMetadata from '@salesforce/apex/ImhotepAppBuilderCtrl.getImhotepActiveMetadata';
import getMyProjects from '@salesforce/apex/ImhotepAppBuilderCtrl.getMyProjects';

// import components
import ImhotepFlowModal from 'c/imhotepFlowModal';

// import custom labels
import HeadingProjectTiles from "@salesforce/label/c.HeadingProjectTiles";
import ActionNewProjectLabel from "@salesforce/label/c.ActionNewProjectLabel";
import ActionNewReleaseLabel from "@salesforce/label/c.ActionNewReleaseLabel";
import ActionNewReleaseFromTemplateLabel from "@salesforce/label/c.ActionNewReleaseFromTemplateLabel";
import ActionRefreshProjectsLabel from "@salesforce/label/c.ActionRefreshProjectsLabel";
import ActionRefreshProjectsAlt from "@salesforce/label/c.ActionRefreshProjectsAlt";
import ReleaseFieldStatusLabel from "@salesforce/label/c.ReleaseFieldStatusLabel";
import ProjectEmptyByStatusHeading from "@salesforce/label/c.ProjectEmptyByStatusHeading";
import ProjectEmptyByStatusText from "@salesforce/label/c.ProjectEmptyByStatusText";

// import static resources
import EMPTY_IMAGE_02 from '@salesforce/resourceUrl/ImhotepIllustrationEmptyState02';

export default class ImhotepMyProjects extends NavigationMixin(LightningElement) {
    @track statusTabs = [];
    @track activeTabValue = null;
    allProjects = [];

    activeMetadata;                 // holds values from the active metadata record (Flow API names, etc.)
    wiredProjectsResult;
    initialized = false;            // flag to ensure initial tab setting happens once

    // store picklist value to label mappings for translation
    projectTypeMap = [];
    releaseStatusMap = [];

    // define custom labels
    label = {
        HeadingProjectTiles,
        ActionNewProjectLabel,
        ActionNewReleaseLabel,
        ActionNewReleaseFromTemplateLabel,
        ActionRefreshProjectsLabel,
        ActionRefreshProjectsAlt,
        ReleaseFieldStatusLabel,
        ProjectEmptyByStatusHeading,
        ProjectEmptyByStatusText,
    }

    // static resource variables
    imageEmptyState02 = EMPTY_IMAGE_02;         // holds the static resource illustration displayed in the empty state of the table



    // ======================================
    // LIFECYCLE HOOKS
    // ======================================

    renderedCallback() {
        if (this.initialized || !this.statusTabs.length) {
            return;     // don't run if already initialized or no tabs yet
        }

        // only set active tab once upon initial render
        const activeTab = this.statusTabs.find(tab => tab.value === 'Active');
        if (activeTab) {
            this.activeTabValue = activeTab.value;
        } else if (this.statusTabs.length > 0) {
            this.activeTabValue = this.statusTabs[0].value;
        }
        this.initialized = true;        // set flag to prevent re-execution
    }



    // ======================================
    // WIRE ADAPTER METHODS
    // ======================================
    
    // retrieves Flow API names for action buttons
    @wire(getImhotepActiveMetadata)
    wiredActiveMetadata({ error, data }) {
        if (data) {
            this.activeMetadata = data;
        } else if (error) {
            console.error('Error retrieving active metadata: ', error);
        }
    }

    

    // retrieves info about the iab__Project__c object
    @wire(getObjectInfo, {
        objectApiName: PROJECT_OBJECT
    })
    projectObjectInfo;

    

    // retrieves info about the iab__Release__c object
    @wire(getObjectInfo, {
        objectApiName: RELEASE_OBJECT
    })
    releaseObjectInfo;



    // retrieves active picklist values for the iab__Project__c object's iab__Status__c field
    @wire(getPicklistValues, {
        recordTypeId: '$projectObjectInfo.data.defaultRecordTypeId',
        fieldApiName: PROJECT_STATUS_FIELD
    })
    projectStatusPicklistValues({ data, error }) {
        if (data) {
            this.statusTabs = data.values.map(val => ({
                label: val.label,
                value: val.value,
                projects: []
            }));

            this.splitProjectsByStatus();
        } else if (error) {
            console.error('Error loading picklist values:', error);
        }
    }



    // retrieves active picklist values for the iab__Project__c object's iab__Type__c field
    @wire(getPicklistValues, {
        recordTypeId: '$projectObjectInfo.data.defaultRecordTypeId',
        fieldApiName: PROJECT_TYPE_FIELD
    })
    projectTypePicklistValues({ data, error }) {
        if (data) {
            this.projectTypeMap = data.values.map(val => ({
                label: val.label,
                value: val.value
            }));

            this.splitProjectsByStatus();
        } else if (error) {
            console.error('Error loading Project Type picklist values:', error);
        }
    }



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

            this.splitProjectsByStatus();
        } else if (error) {
            console.error('Error loading Release Status picklist values:', error);
        }
    }



    // retrieves all projects the user has access to, along with their key releases
    @wire(getMyProjects)
    wiredProjects(result) {
        this.wiredProjectsResult = result;
        const { data, error } = result;
        if (data) {
            this.allProjects = data.map(proj => {
                const rawReleases = [...(proj.iab__Releases__r || [])];

                const getWeight = (r) => {
                    if (r.iab__Is_Backlog__c) return 0;
                    if (r.iab__Status__c === 'Planning') return 1;
                    if (r.iab__Status__c === 'Active') return 2;
                    return 3;
                };

                const sortedReleases = rawReleases
                    .sort((a, b) => {
                        const weightA = getWeight(a);
                        const weightB = getWeight(b);
                        if (weightA !== weightB) {
                            return weightA - weightB;
                        }
                        return (a.Name || '').localeCompare(b.Name || '');
                    })
                    .map(rel => ({
                        ...rel,
                        style:
                            rel.iab__Is_Backlog__c ? 'background-color: #f2f2f2;' :
                            rel.iab__Status__c === 'Planning' ? 'background-color: #eef4ff;' :
                            rel.iab__Status__c === 'Active' ? 'background-color: #05628a; color: #FFFFFF;' :
                            'background-color: #ffffff;',
                        icon:
                            rel.iab__Is_Backlog__c ? 'utility:frozen' :
                            rel.iab__Status__c === 'Planning' ? 'utility:edit' :
                            rel.iab__Status__c === 'Active' ? 'utility:kanban' :
                            'utility:kanban',
                        iconUseInverseVariant:
                            rel.iab__Status__c === 'Active' ? true :
                            false
                    }));

                return {
                    ...proj,
                    releases: sortedReleases
                };
            });

            this.splitProjectsByStatus();
        } else if (error) {
            console.error('Error loading projects:', error);
        }
    }



    // ======================================
    // EVENT HANDLER METHODS
    // ======================================

    // refreshes project and release data
    handleRefresh() {
        return refreshApex(this.wiredProjectsResult);
    }



    // opens the designated flow for creating a new project
    // related metadata field is:   iab__General_New_Project__c
    // related flow API name is:    iab__Imhotep_General_NewProject
    openNewProjectFlow(event) {
        const result = ImhotepFlowModal.open({
            size: 'medium',
            label: this.label.ActionNewProjectLabel,
            flowAPIName: this.activeMetadata.iab__General_New_Project__c
        }).then((result) => {
            refreshApex(this.wiredProjectsResult);
        });
    }



    // opens the designated flow for creating a new release
    // related metadata field is:   iab__Project_New_Release__c
    // related flow API name is:    iab__Imhotep_Project_NewRelease
    openNewReleaseFlow(event) {
        const projectId = event.target.dataset.id;

        const result = ImhotepFlowModal.open({
            size: 'medium',
            label: this.label.ActionNewReleaseLabel,
            flowAPIName: this.activeMetadata.iab__Project_New_Release__c,
            inputVariables: [
                {
                    name: 'recordId',
                    type: 'String',
                    value: projectId
                }
            ]
        }).then((result) => {
            refreshApex(this.wiredProjectsResult);
        });
    }



    // opens the designated flow for creating a new release from a template
    // related metadata field is:   iab__Project_New_Release__c
    // related flow API name is:    iab__Imhotep_Project_CreateReleaseFromTemplate
    openNewReleaseFromTemplateFlow(event) {
        const projectId = event.target.dataset.id;

        const result = ImhotepFlowModal.open({
            size: 'medium',
            label: this.label.ActionNewReleaseFromTemplateLabel,
            flowAPIName: this.activeMetadata.iab__Project_Create_Release_from_Template__c,
            inputVariables: [
                {
                    name: 'recordId',
                    type: 'String',
                    value: projectId
                }
            ]
        }).then((result) => {
            refreshApex(this.wiredProjectsResult);
        });
    }



    // opens the selected project record in a new console tab
    openRecord(event) {
        const selectedObjectApiName = event.currentTarget.dataset.object;
        const selectedRecordId = event.currentTarget.dataset.record;

        this[NavigationMixin.Navigate]({
          type: "standard__recordPage",
          attributes: {
            recordId: selectedRecordId,
            objectApiName: selectedObjectApiName,
            actionName: "view",
          },
        });
    }



    // opens the selected release record in a new console tab
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

    // sorts releases into this order: backlogs, then Planning releases, then Active releases.
    releaseSort(a, b) {
        if (a.iab__Is_Backlog__c !== b.iab__Is_Backlog__c) {
            return a.iab__Is_Backlog__c ? -1 : 1;
        }
        const statusOrder = ['Planning', 'Active'];
        return statusOrder.indexOf(a.iab__Status__c) - statusOrder.indexOf(b.iab__Status__c);
    }



    // processes and categorizes projects into status tabs, applying translations to Project Types and Release Status picklist values as available.
    splitProjectsByStatus() {
        // ensure all data dependencies are met before proceeding
        if (!this.statusTabs.length || !this.allProjects.length || !this.projectTypeMap.length || !this.releaseStatusMap.length) {
            return;
        }

        // initialize projects for each tab (clear previous assignments)
        this.statusTabs.forEach(tab => tab.projects = []);

        // process each project to apply translations and assign to tabs
        const processedProjects = this.allProjects.map(proj => {
            // find translated type for the project
            const projectTypeMatch = this.projectTypeMap.find(
                item => item.value === proj.iab__Type__c
            );
            const translatedProjectType = projectTypeMatch ? projectTypeMatch.label : proj.iab__Type__c;

            // process releases within the project to apply translated status
            const processedReleases = proj.releases.map(rel => {
                // Find translated status for the release (FIXED THIS LINE)
                const releaseStatusMatch = this.releaseStatusMap.find(
                    item => item.value === rel.iab__Status__c
                );
                const translatedReleaseStatus = releaseStatusMatch ? releaseStatusMatch.label : rel.iab__Status__c;

                return {
                    ...rel,
                    translatedStatus: translatedReleaseStatus // Use the found translated status
                };
            });

            // return the modified project object
            return {
                ...proj,
                translatedType: translatedProjectType,
                releases: processedReleases     // use the processed releases
            };
        });

        // assign processed projects to their respective status tabs
        processedProjects.forEach(proj => {
            const tab = this.statusTabs.find(t => t.value === proj.iab__Status__c);
            if (tab) {
                tab.projects.push(proj);
                // sort projects within each tab
                tab.projects.sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));
            }
        });

        // trigger reactivity for statusTabs
        this.statusTabs = [...this.statusTabs];
    }

}