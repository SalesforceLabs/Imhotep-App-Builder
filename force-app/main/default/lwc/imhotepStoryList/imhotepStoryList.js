// *******************************************************************************************
// @Name		    imhotepStoryList
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date		    08/14/2023
// @Description	    LWC displays a list of Story records on a Release that can be reordered using drag-and-drop.
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
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import Id from "@salesforce/user/Id";

// import object and field info
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import STORY_OBJECT from '@salesforce/schema/Story__c';
import STORY_STATUS_FIELD from '@salesforce/schema/Story__c.Status__c';
import STORY_TYPE_FIELD from '@salesforce/schema/Story__c.Story_Type__c';

// import Apex
import getImhotepActiveMetadata from '@salesforce/apex/ImhotepAppBuilderCtrl.getImhotepActiveMetadata';
import getStoriesByRelease from '@salesforce/apex/ImhotepAppBuilderCtrl.getStoriesByRelease';
import saveReorderedStories from '@salesforce/apex/ImhotepAppBuilderCtrl.saveReorderedStories';
import checkUserEditAccess from '@salesforce/apex/ImhotepAppBuilderCtrl.checkUserEditAccess';

// import components
import ImhotepFlowModal from 'c/imhotepFlowModal';

// import custom labels
import ActionAddTemplateStoriesLabel from "@salesforce/label/c.ActionAddTemplateStoriesLabel";
import ActionCloneStoryAlt from "@salesforce/label/c.ActionCloneStoryAlt";
import ActionCloneStoryLabel from "@salesforce/label/c.ActionCloneStoryLabel";
import ActionCreateTemplateLabel from "@salesforce/label/c.ActionCreateTemplateLabel";
import ActionDeleteStoryAlt from "@salesforce/label/c.ActionDeleteStoryAlt";
import ActionDeleteStoryLabel from "@salesforce/label/c.ActionDeleteStoryLabel";
import ActionDragAndDropIconLabel from "@salesforce/label/c.ActionDragAndDropIconLabel";
import ActionDragAndDropIconTitle from "@salesforce/label/c.ActionDragAndDropIconTitle";
import ActionEditStoryAlt from "@salesforce/label/c.ActionEditStoryAlt";
import ActionEditStoryLabel from "@salesforce/label/c.ActionEditStoryLabel";
import ActionHideStoryDescriptionAlt from "@salesforce/label/c.ActionHideStoryDescriptionAlt";
import ActionHideStoryDescriptionLabel from "@salesforce/label/c.ActionHideStoryDescriptionLabel";
import ActionNewStoryLabel from "@salesforce/label/c.ActionNewStoryLabel";
import ActionRefreshStoriesAlt from "@salesforce/label/c.ActionRefreshStoriesAlt";
import ActionRefreshStoriesLabel from "@salesforce/label/c.ActionRefreshStoriesLabel";
import ActionReorderStoryErrorTitle from "@salesforce/label/c.ActionReorderStoryErrorTitle";
import ActionReorderStorySuccessMessage from "@salesforce/label/c.ActionReorderStorySuccessMessage";
import ActionReorderStorySuccessTitle from "@salesforce/label/c.ActionReorderStorySuccessTitle";
import ActionShowStoryDescriptionAlt from "@salesforce/label/c.ActionShowStoryDescriptionAlt";
import ActionShowStoryDescriptionLabel from "@salesforce/label/c.ActionShowStoryDescriptionLabel";
import ActionTableColActionsLabel from "@salesforce/label/c.ActionTableColActionsLabel";
import ActionTransferStoryAlt from "@salesforce/label/c.ActionTransferStoryAlt";
import ActionTransferStoryLabel from "@salesforce/label/c.ActionTransferStoryLabel";
import HeadingStoryList from "@salesforce/label/c.HeadingStoryList";
import StoryEmptyHeading from "@salesforce/label/c.StoryEmptyHeading";
import StoryEmptyText1 from "@salesforce/label/c.StoryEmptyText1";
import StoryEmptyText2 from "@salesforce/label/c.StoryEmptyText2";
import StoryFieldAssignedLabel from "@salesforce/label/c.StoryFieldAssignedLabel";
import StoryFieldAssignedUnassigned from "@salesforce/label/c.StoryFieldAssignedUnassigned";
import StoryFieldExpediteIconTitle from "@salesforce/label/c.StoryFieldExpediteIconTitle";
import StoryFieldLastModifiedLabel from "@salesforce/label/c.StoryFieldLastModifiedLabel";
import StoryFieldPointsAct from "@salesforce/label/c.StoryFieldPointsAct";
import StoryFieldPointsEst from "@salesforce/label/c.StoryFieldPointsEst";
import StoryFieldPointsLabel from "@salesforce/label/c.StoryFieldPointsLabel";
import StoryFieldPriorityLabel from "@salesforce/label/c.StoryFieldPriorityLabel";
import StoryFieldStatusLabel from "@salesforce/label/c.StoryFieldStatusLabel";
import StoryFieldStoryDescriptionLabel from "@salesforce/label/c.StoryFieldStoryDescriptionLabel";
import StoryFieldStoryNumberLabel from "@salesforce/label/c.StoryFieldStoryNumberLabel";
import StoryFieldStoryTypeLabel from "@salesforce/label/c.StoryFieldStoryTypeLabel";
import StoryFieldTitleLabel from "@salesforce/label/c.StoryFieldTitleLabel";
import StoryHeading from "@salesforce/label/c.StoryHeading";

// import static resources
import EMPTY_IMAGE_02 from '@salesforce/resourceUrl/ImhotepIllustrationEmptyState02';

export default class ImhotepStoryList extends NavigationMixin(LightningElement) {

    // set incoming variables
    @api recordId;                              // current page's iab__Release__c recordId
    userId = Id;                                // current user's recordId

    storyStatusMap = [];                        // stores a value-to-label mapping for translation of the Story iab__Status__c picklist
    storyTypeMap = [];                          // stores a value-to-label mapping for translation of the Story iab__Type__c picklist

    // header variables
    storiesRelatedListURL;                      // used to hold the calculated URL for accessing the full standard related list for stories

    // prep variables for receiving results of Apex methods
    activeMetadata;                             // holds values from the active metadata record (Flow API names, etc.)
    userHasEditAccess = false;                  // controls if user can edit release or drag and drop stories in the list
    
    wiredStories;                               // holds the wired result for refreshApex from getStoriesByRelease()
    @track mockStories = [];                    // holds the mutated list of story records to use in the table, containing miscellaneous values that weren't part of the object records
    allStoriesRaw = [];
    numStoryCount;                              // total number of records in mockStories
    hideStoryTable = true;                      // controls whether or not to hide the story table and instead display an empty state illustration card

    // drag-and-drop functionality variables
    isDraggable = true;                         // controls whether the user can reorder story rows in the table or not
    dragSource;                                 // stores the current target for the story being dragged
    dragSourceId;                               // data-id value from the current target stored in dragSource

    // define custom labels
    label = {
        ActionAddTemplateStoriesLabel,
        ActionCloneStoryAlt,
        ActionCloneStoryLabel,
        ActionCreateTemplateLabel,
        ActionDeleteStoryAlt,
        ActionDeleteStoryLabel,
        ActionDragAndDropIconLabel,
        ActionDragAndDropIconTitle,
        ActionEditStoryAlt,
        ActionEditStoryLabel,
        ActionHideStoryDescriptionAlt,
        ActionHideStoryDescriptionLabel,
        ActionNewStoryLabel,
        ActionRefreshStoriesAlt,
        ActionRefreshStoriesLabel,
        ActionReorderStoryErrorTitle,
        ActionReorderStorySuccessMessage,
        ActionReorderStorySuccessTitle,
        ActionShowStoryDescriptionAlt,
        ActionShowStoryDescriptionLabel,
        ActionTableColActionsLabel,
        ActionTransferStoryAlt,
        ActionTransferStoryLabel,
        HeadingStoryList,
        StoryEmptyHeading,
        StoryEmptyText1,
        StoryEmptyText2,
        StoryFieldAssignedLabel,
        StoryFieldAssignedUnassigned,
        StoryFieldExpediteIconTitle,
        StoryFieldLastModifiedLabel,
        StoryFieldPointsAct,
        StoryFieldPointsEst,
        StoryFieldPointsLabel,
        StoryFieldPriorityLabel,
        StoryFieldStatusLabel,
        StoryFieldStoryDescriptionLabel,
        StoryFieldStoryNumberLabel,
        StoryFieldStoryTypeLabel,
        StoryFieldTitleLabel,
        StoryHeading,
    }

    // static resource variables
    imageEmptyState02 = EMPTY_IMAGE_02;         // holds the static resource illustration displayed in the empty state of the table
    

    
    // ======================================
    // LIFECYCLE HOOKS
    // ======================================
    
    connectedCallback(){
        // prepare the URL used in the list header for accessing the full standard related list for stories
        this.storiesRelatedListURL = '/lightning/r/iab__Release__c/' + this.recordId + '/related/iab__Stories__r/view';
    }



    // ======================================
    // WIRE ADAPTER METHODS
    // ======================================

    // retrieves info about the iab__Story__c object
    @wire(getObjectInfo, {
        objectApiName: STORY_OBJECT
    })
    storyObjectInfo;



    // retrieves active picklist values for the iab__Story__c object's iab__Status__c field
    @wire(getPicklistValues, {
        recordTypeId: '$storyObjectInfo.data.defaultRecordTypeId',
        fieldApiName: STORY_STATUS_FIELD
    })
    storyStatusPicklistValues({ data, error }) {
        if (data) {
            this.storyStatusMap = data.values.map(val => ({
                label: val.label,
                value: val.value
            }));

            // trigger the processing method
            this.processStoryData();
            
        } else if (error) {
            console.error('Error loading Story Status picklist values:', error);
        }
    }



    // retrieves active picklist values for the iab__Story__c object's iab__Story_Type__c field
    @wire(getPicklistValues, {
        recordTypeId: '$storyObjectInfo.data.defaultRecordTypeId',
        fieldApiName: STORY_TYPE_FIELD
    })
    storyTypePicklistValues({ data, error }) {
        if (data) {
            this.storyTypeMap = data.values.map(val => ({
                label: val.label,
                value: val.value
            }));

            // trigger the processing method
            this.processStoryData();
            
        } else if (error) {
            console.error('Error loading Story Type picklist values:', error);
        }
    }
    
    
    
    // wire the getImhotepActiveMetadata() method to retrieve Flow API names for action buttons
    @wire(getImhotepActiveMetadata)
    wiredActiveMetadata({ error, data }) {
        if (data) {
            this.activeMetadata = data;
        } else if (error) {
            console.error('Error retrieving active metadata: ', error);
        }
    }
    
    
    
    // wire the checkUserEditAccess() method to retrieve true/false for whether user should be able to drag-and-drop stories in the list
    @wire(checkUserEditAccess, {
        ParamReleaseId: '$recordId',
        ParamUserId: '$userId'
    })
    wiredEditAccess({ error, data }) {
        if (data) {
            this.userHasEditAccess = data;
        } else if (error) {
            this.userHasEditAccess = false;
            console.error('Error determining user right to edit the release: ', error);
        }

        // set whether or not the user can drag and drop stories
        this.isDraggable = this.userHasEditAccess;
    }



    // wire the getStoriesByRelease() method to get a list of Stories related to the current page's Release record
    @wire(getStoriesByRelease, {
        ParamReleaseId: '$recordId'
    })
    // wired so the provisioned value could be refreshed by refreshApex later when flows close.
    wiredReleaseStories(value) {
        // hold on to the provisioned value so we can refresh it later.
        this.wiredStories = value; // track the provisioned value
        const { data, error } = value; // destructure the provisioned value

        if (data) {
            // reset
            this.mockStories = [];

            // store raw data; transformations and translations will happen in processStoryData()
            this.allStoriesRaw = data;

            // trigger the processing method
            this.processStoryData();

        }
        else if (error) {
            this.numStoryCount = 0;
            this.hideStoryTable = true;
            
            // prep the header text to include the number of stories
            this.storiesRelatedListHeader = this.label.HeadingStoryList + ' (' + this.numStoryCount + ')';

            console.error('Error retrieving stories: ', error);
        }
    }



    // ======================================
    // EVENT HANDLER METHODS
    // ======================================

    handleDragEnd(event) {
        // reset the CSS now that we're done dragging
        this.dragSource.classList.remove('dragging', 'slds-drop-zone', 'slds-drop-zone_drag', 'slds-theme_shade');
        
        // update the order of the story record rows
        this.updateStory();
    }



    handleDragEnter(event) {
        // find the first <TR> node encapsulating whatever subnode we clicked on while dragging the row.
        let targetelem = event.target;

        while (targetelem.nodeName !== 'TR') targetelem = targetelem.parentNode;

        if(this.isbefore(this.dragSource, targetelem)) {
            targetelem.parentNode.insertBefore(this.dragSource, targetelem);
        }
        else {
            targetelem.parentNode.insertBefore(this.dragSource, targetelem.nextSibling);
        }

    }



    handleDragStart(event) {
        this.dragSource = event.target;
        this.dragSourceId = this.dragSource.getAttribute('data-id');
        event.dataTransfer.effectAllowed = 'move';
        this.dragSource.classList.add('dragging', 'slds-drop-zone', 'slds-drop-zone_drag', 'slds-theme_shade');
    }
    
    
    
    handleExpansion(event) {
        // Get the Id from the clicked element
        const clickedStoryId = event.currentTarget.dataset.id;

        // Update the isExpanded property for the clicked story
        this.mockStories = this.mockStories.map(story => {
            if (story.Id === clickedStoryId) {
                // Toggle isExpanded
                return {
                    ...story,
                    isExpanded: !story.isExpanded
                };
            }
            return story;
        });
    }



    // open flow to clone a story when the button is clicked
    // related metadata field is:   iab__Story_Clone__c
    // related flow API name is:    iab__Imhotep_Story_Clone
    handleStoryClone(event) {

        // determine which story was clicked on
        let eventStoryId = event.target.getAttribute('data-id');

        const result = ImhotepFlowModal.open({
            size: 'medium',
            label: this.label.ActionCloneStoryLabel,
            flowAPIName: this.activeMetadata.iab__Story_Clone__c,
            inputVariables: [
                {
                    name: 'recordId',
                    type: 'String',
                    value: eventStoryId
                }
            ]
        }).then((result) => {
            refreshApex(this.wiredStories);
        });
    }



    // open flow to delete a story when the button is clicked
    // related metadata field is:   iab__Release_Delete_Story__c
    // related flow API name is:    iab__Imhotep_Release_DeleteStory
    handleStoryDelete(event) {

        // determine which story was clicked on
        let eventStoryId = event.target.getAttribute('data-id');

        const result = ImhotepFlowModal.open({
            size: 'medium',
            label: this.label.ActionDeleteStoryLabel,
            flowAPIName: this.activeMetadata.iab__Release_Delete_Story__c,
            inputVariables: [
                {
                    name: 'recordId',
                    type: 'String',
                    value: eventStoryId
                }
            ]
        }).then((result) => {
            refreshApex(this.wiredStories);
        });
    }



    // open flow to edit a story when the button is clicked
    // related metadata field is:   iab__Story_Edit__c
    // related flow API name is:    Imhotep_Story_Edit
    handleStoryEdit(event) {
        // determine which story was clicked on
        let eventStoryId = event.target.getAttribute('data-id');

        const result = ImhotepFlowModal.open({
            size: 'large',
            label: this.label.ActionEditStoryLabel,
            flowAPIName: this.activeMetadata.iab__Story_Edit__c,
            inputVariables: [
                {
                    name: 'recordId',
                    type: 'String',
                    value: eventStoryId
                }
            ]
        }).then((result) => {
            refreshApex(this.wiredStories);
        });
    }



    // open flow to transfer a story to a different release when the button is clicked
    // related metadata field is:   iab__Story_Transfer__c
    // related flow API name is:    Imhotep_Story_Transfer
    handleStoryTransfer(event) {
        // determine which story was clicked on
        let eventStoryId = event.target.getAttribute('data-id');

        const result = ImhotepFlowModal.open({
            size: 'small',
            label: this.label.ActionTransferStoryLabel,
            flowAPIName: this.activeMetadata.iab__Story_Transfer__c,
            inputVariables: [
                {
                    name: 'recordId',
                    type: 'String',
                    value: eventStoryId
                }
            ]
        }).then((result) => {
            refreshApex(this.wiredStories);
        });
    }



    // open flow to add stories from a template
    // related metadata field is:   iab__Release_Add_Template_to_Release__c
    // related flow API name is:    iab__Imhotep_Release_AddTemplateToRelease
    openAddTemplateStoriesFlow(event) {
        const result = ImhotepFlowModal.open({
            size: 'medium',
            label: this.label.ActionAddTemplateStoriesLabel,
            flowAPIName: this.activeMetadata.iab__Release_Add_Template_to_Release__c,
            inputVariables: [
                {
                    name: 'recordId',
                    type: 'String',
                    value: this.recordId
                }
            ]
        }).then((result) => {
            refreshApex(this.wiredStories);
        });
    }



    // open flow to create a template from stories in the release
    // related metadata field is:   iab__Release_Create_Template_from_Release__c
    // related flow API name is:    iab__Imhotep_Release_CreateTemplateFromRelease
    openCreateTemplateFlow(event) {
        const result = ImhotepFlowModal.open({
            size: 'medium',
            label: this.label.ActionCreateTemplateLabel,
            flowAPIName: this.activeMetadata.iab__Release_Create_Template_from_Release__c,
            inputVariables: [
                {
                    name: 'recordId',
                    type: 'String',
                    value: this.recordId
                }
            ]
        }).then((result) => {
            refreshApex(this.wiredStories);
        });
    }



    // open flow to create a new story when the button is clicked
    // related metadata field is:   iab__Release_New_Story__c
    // related flow API name is:    iab__Imhotep_Release_NewStory
    openNewStoryFlow(event) {
        const result = ImhotepFlowModal.open({
            size: 'medium',
            label: this.label.ActionNewStoryLabel,
            flowAPIName: this.activeMetadata.iab__Release_New_Story__c,
            inputVariables: [
                {
                    name: 'recordId',
                    type: 'String',
                    value: this.recordId
                }
            ]
        }).then((result) => {
            refreshApex(this.wiredStories);
        });
    }


    
    // ======================================
    // PRIVATE HELPER METHODS
    // ======================================

    isbefore(a, b) {
        if (a.parentNode == b.parentNode) {
            for (let cur = a; cur; cur = cur.previousSibling) {
                if (cur === b) return true;
            }
        }
        return false;
    }



    // processes story data and applies translations once all dependencies are met
    processStoryData() {
        // ensure all data dependencies are met before proceeding
        // check if raw data exists and if the storyStatusMap is populated
        if (!this.allStoriesRaw || this.allStoriesRaw.length === 0 || !this.storyStatusMap || this.storyStatusMap.length === 0 || !this.storyTypeMap || this.storyTypeMap.length === 0) {
            // console.log('processStoryData: Waiting for all data dependencies to be met.');
            return;
        }

        // helper function to get translated Story Status
        const getTranslatedStoryStatus = (statusValue) => {
            const match = this.storyStatusMap.find(item => item.value === statusValue);
            return match ? match.label : statusValue;       // fallback to original value if no translation found
        };

        // helper function to get translated Story Type
        const getTranslatedStoryType = (typeValue) => {
            const match = this.storyTypeMap.find(item => item.value === typeValue);
            return match ? match.label : typeValue;       // fallback to original value if no translation found
        };

        this.mockStories = this.allStoriesRaw.map(story => ({
            Id: story.Id,
            Name: story.Name,
            Story_URL: '/lightning/r/iab__Story__c/' + story.Id + '/view',
            Story_Description__c: story.iab__Story_Description__c,
            Actual_Points__c: story.iab__Actual_Points__c,
            Expedite__c: story.iab__Expedite__c,
            Estimated_Points__c: story.iab__Estimated_Points__c,
            Priority_Order__c: story.iab__Priority_Order__c,
            Status__c: getTranslatedStoryStatus(story.iab__Status__c),
            Story_Number__c: story.iab__Story_Number__c,
            Story_Type__c: getTranslatedStoryType(story.iab__Story_Type__c),
            LastModifiedDate: story.LastModifiedDate,
            Assigned__c: story.iab__Assigned__c,
            Assigned_URL: '/lightning/r/iab__Project_Member__c/' + story.iab__Assigned__c + '/view',
            Assigned_Name__c: story.iab__Assigned_Name__c,
            isExpandable: story.iab__Story_Description__c ? true : false,
            isExpanded: false
        }));

        this.numStoryCount = this.mockStories.length;
        if(this.numStoryCount > 0) {
            this.hideStoryTable = false;
        }
        else {
            this.hideStoryTable = true;
        }
        
        // prep the header text to include the number of stories
        this.storiesRelatedListHeader = this.label.HeadingStoryList + ' (' + this.numStoryCount + ')';
    }



    // refreshes the data in the table when the refresh icon button is clicked
    refreshList() {
        refreshApex(this.wiredStories);
    }



    updateStory() {

        // get the rows from the table in the UI and record their order in the map
        const rows = Array.from(this.refs.storyTable.getElementsByTagName("tr"));

        let orderedMap = {};

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            
            // get the Id for the row's record (data-id)
            const dataId = row.getAttribute('data-id');
            
            // store the key-value pair in the orderedMap map where new order value is i (order in the list)
            orderedMap[dataId] = i;
        }

        saveReorderedStories({ orderedMap })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: this.label.ActionReorderStorySuccessTitle,
                        message: this.label.ActionReorderStorySuccessMessage,
                        variant: 'success',
                        mode: 'dismissable'
                    }),
                );
                
                // Display fresh data in the form
                refreshApex(this.wiredStories);
            })
            .catch((error) => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: this.label.ActionReorderStoryErrorTitle,
                        message: JSON.stringify(error),
                        variant: 'error',
                        mode: 'sticky'
                    })
                );
            });
    }
}