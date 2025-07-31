// *******************************************************************************************
// @Name		    imhotepStoryKanban
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date		    07/14/2025
// @Description	    LWC displays a dynamic, interactive Kanban board for Story__c records related to a given Release__c.
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
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import Id from "@salesforce/user/Id";

// import object and field info
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import STORY_OBJECT from '@salesforce/schema/Story__c';
import STORY_STATUS_FIELD from '@salesforce/schema/Story__c.Status__c';
import STORY_TYPE_FIELD from '@salesforce/schema/Story__c.Story_Type__c';

// import Apex
import checkUserEditAccess from '@salesforce/apex/ImhotepAppBuilderCtrl.checkUserEditAccess';
import getAssignedProjectMembersForRelease from '@salesforce/apex/ImhotepAppBuilderCtrl.getAssignedProjectMembersForRelease';
import getImhotepActiveMetadata from '@salesforce/apex/ImhotepAppBuilderCtrl.getImhotepActiveMetadata';
import getStoriesForRelease from '@salesforce/apex/ImhotepAppBuilderCtrl.getStoriesForRelease';
import getTagsForRelease from '@salesforce/apex/ImhotepAppBuilderCtrl.getTagsForRelease';
import moveStory from '@salesforce/apex/ImhotepAppBuilderCtrl.moveStory';

// import custom labels
import HeadingKanbanRelease from "@salesforce/label/c.HeadingKanbanRelease";
import ActionRefreshKanbanLabel from "@salesforce/label/c.ActionRefreshKanbanLabel";
import ActionRefreshKanbanAlt from "@salesforce/label/c.ActionRefreshKanbanAlt";
import ActionToggleFiltersKanbanLabel from "@salesforce/label/c.ActionToggleFiltersKanbanLabel";
import ActionToggleFiltersKanbanAlt from "@salesforce/label/c.ActionToggleFiltersKanbanAlt";
import ActionNewStoryLabel from "@salesforce/label/c.ActionNewStoryLabel";
import ActionAddTemplateStoriesLabel from "@salesforce/label/c.ActionAddTemplateStoriesLabel";
import ActionCreateTemplateLabel from "@salesforce/label/c.ActionCreateTemplateLabel";
import InputSearchKanbanLabel from "@salesforce/label/c.InputSearchKanbanLabel";
import InputSearchKanbanHelp from "@salesforce/label/c.InputSearchKanbanHelp";
import InputTagFilterKanbanLabel from "@salesforce/label/c.InputTagFilterKanbanLabel";
import InputTagFilterKanbanHelp from "@salesforce/label/c.InputTagFilterKanbanHelp";
import InputAssigneeFilterKanbanLabel from "@salesforce/label/c.InputAssigneeFilterKanbanLabel";
import ActionSearchFilterResetKanbanLabel from "@salesforce/label/c.ActionSearchFilterResetKanbanLabel";
import StoryFieldStoryTypeDefectIconTitle from "@salesforce/label/c.StoryFieldStoryTypeDefectIconTitle";
import StoryFieldExpediteIconTitle from "@salesforce/label/c.StoryFieldExpediteIconTitle";
import StoryFieldAssignedUnassigned from "@salesforce/label/c.StoryFieldAssignedUnassigned";
import StoryFieldPriorityLabel from "@salesforce/label/c.StoryFieldPriorityLabel";
import StoryFieldPointsLabel from "@salesforce/label/c.StoryFieldPointsLabel";
import StoryFieldPointsEst from "@salesforce/label/c.StoryFieldPointsEst";
import StoryFieldPointsAct from "@salesforce/label/c.StoryFieldPointsAct";
import StoryEmptyByStatusText from "@salesforce/label/c.StoryEmptyByStatusText";
import ActionMoveStorySuccessTitle from "@salesforce/label/c.ActionMoveStorySuccessTitle";
import ActionMoveStorySuccessMessage from "@salesforce/label/c.ActionMoveStorySuccessMessage";
import ActionMoveStoryErrorTitle from "@salesforce/label/c.ActionMoveStoryErrorTitle";
import KanbanFilterValueStoriesWithoutTags from "@salesforce/label/c.KanbanFilterValueStoriesWithoutTags";
import KanbanFilterValueUnassignedStories from "@salesforce/label/c.KanbanFilterValueUnassignedStories";
import InputOtherAttributesFilterKanbanLabel from "@salesforce/label/c.InputOtherAttributesFilterKanbanLabel";
import InputStoryTypeFilterKanbanLabel from "@salesforce/label/c.InputStoryTypeFilterKanbanLabel";

// import components
import ImhotepFlowModal from 'c/imhotepFlowModal';

export default class ImhotepStoryKanban extends LightningElement {
    @api recordId;                                  // record Id for the iab__Release__c

    storyObjectInfo;
    userId = Id;                                    // current user's recordId

    // Apex query result variables and related post-processing variables
    @track userHasEditAccess = false;               // controls if user can edit release or drag and drop stories in the list
    activeMetadata;                                 // holds values from the active metadata record (Flow API names, etc.)
    @track wiredStoriesResult;
    @track colorMap = {};
    @track columns = [];
    @track allStories = [];
    @track filteredStories = [];

    kanbanHeight = '73vh';                          // default height of Kanban board, in pixels
    isKanbanExpanded = false;                       // controls whether Kanban columns are set to kanbanHeight or something larger
    columnStyle;                                    // sets the height of Kanban columns
    expandKanbanButtonIcon = 'utility:expand_all';  // icon used for the Expand Kanban button

    // search and filter variables
    @track showFilters = false;                     // controls whether the filter card is visible
    @track renderAndAnimateFilter = false;
    
    @track searchKey = '';

    @track showOnlyExpedited = false;

    @track storyTypes = [];
    @track selectedStoryType = null;

    @track tags = [];
    @track selectedTags = new Set();
    
    @track assignedUsers = [];
    @track selectedAssignees = new Set();

    // drag-and-drop functionality variables
    isDraggable = true;                             // controls whether the user can reorder story rows in the table or not

    // define custom labels
    label = {
        HeadingKanbanRelease,
        ActionRefreshKanbanLabel,
        ActionRefreshKanbanAlt,
        ActionToggleFiltersKanbanLabel,
        ActionToggleFiltersKanbanAlt,
        ActionNewStoryLabel,
        ActionAddTemplateStoriesLabel,
        ActionCreateTemplateLabel,
        InputSearchKanbanLabel,
        InputSearchKanbanHelp,
        InputTagFilterKanbanLabel,
        InputTagFilterKanbanHelp,
        InputAssigneeFilterKanbanLabel,
        ActionSearchFilterResetKanbanLabel,
        StoryFieldStoryTypeDefectIconTitle,
        StoryFieldExpediteIconTitle,
        StoryFieldAssignedUnassigned,
        StoryFieldPriorityLabel,
        StoryFieldPointsLabel,
        StoryFieldPointsEst,
        StoryFieldPointsAct,
        StoryEmptyByStatusText,
        ActionMoveStorySuccessTitle,
        ActionMoveStorySuccessMessage,
        ActionMoveStoryErrorTitle,
        KanbanFilterValueStoriesWithoutTags,
        KanbanFilterValueUnassignedStories,
        InputOtherAttributesFilterKanbanLabel,
        InputStoryTypeFilterKanbanLabel,
    };



    // ======================================
    // GETTERS
    // ======================================

    // retrieve the translated label/name of the iab__Expedite__c field
    get expeditedLabel() {
        return this.storyObjectInfo?.data?.fields?.iab__Expedite__c?.label || 'Expedited';
    }
    

    
    get toggleFilterButtonVariant() {
        return this.showFilters ? 'brand' : 'brand-outline';
    }



    // ======================================
    // LIFECYCLE HOOKS
    // ======================================

    renderedCallback() {
        if (this.renderAndAnimateFilter && this.showFilters) {
            const el = this.template.querySelector('.iab-filter-card');
            if (el) {
                // ensure it’s visible before calculating height
                el.style.maxHeight = '0px';
                el.style.opacity = '0';
                el.style.overflow = 'hidden';

                requestAnimationFrame(() => {
                    const fullHeight = el.scrollHeight;

                    el.style.transition = 'max-height 0.3s ease, opacity 0.3s ease';
                    el.style.maxHeight = `${fullHeight}px`;
                    el.style.opacity = '1';

                    setTimeout(() => {
                        el.style.maxHeight = '';
                        el.style.transition = '';
                        el.style.overflow = '';
                        this.renderAndAnimateFilter = false;
                    }, 300);
                });
            } else {
                this.renderAndAnimateFilter = false;
            }
        }
    }



    // ======================================
    // WIRE ADAPTER METHODS
    // ======================================

    // retrieves Flow API names for action buttons
    @wire(getImhotepActiveMetadata)
    wiredActiveMetadata({ error, data }) {
        if (data) {
            this.activeMetadata = data;
            this.kanbanHeight = this.activeMetadata.iab__Default_Story_Kanban_Height__c
            this.columnStyle = `height: ${this.kanbanHeight};`;
        } else if (error) {
            this.columnStyle = `height: ${this.kanbanHeight};`;
            console.error('Error retrieving active metadata: ', error);
        }
    }



    // retrieves all unique project members for stories in the release
    @wire(getAssignedProjectMembersForRelease, {
        ParamReleaseId: '$recordId'
    })
    wiredAssignees({ error, data }) {
        if (data) {
            const unassignedBadge = {
                Id: '__UNASSIGNED__',
                Name: this.label.KanbanFilterValueUnassignedStories,
                class: this.selectedAssignees.has('__UNASSIGNED__') ? 'iab-clickable-badge iab-badge-selected' : 'iab-clickable-badge'
            };

            const realUsers = data.map(user => ({
                ...user,
                class: this.selectedAssignees.has(user.Id) ? 'iab-clickable-badge iab-badge-selected' : 'iab-clickable-badge'
            }));

            this.assignedUsers = [unassignedBadge, ...realUsers];
        } else if (error) {
            console.error('Error loading project members', error);
        }
    }
    
    
    
    // retrieves true/false for whether user should be able to drag-and-drop stories in the list
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
    wiredStoryStatusPicklist({ error, data }) {
        if (data) {
            this.columns = data.values.map((val, index) => {
                const color = this.generateColor(index);
                const lightColor = this.lightenColor(color, 0.65);
                this.colorMap[val.value] = color;

                return {
                    label: val.label,
                    value: val.value,
                    stories: [],
                    cardBackgroundStyle: `background-color: ${lightColor};`
                };
            });

            this.applyFilters();
        } else if (error) {
            console.error('Error loading status picklist values', error);
        }
    }



    // retrieves active picklist values for the iab__Story__c object's iab__Type__c field
    @wire(getPicklistValues, {
        recordTypeId: '$storyObjectInfo.data.defaultRecordTypeId',
        fieldApiName: STORY_TYPE_FIELD
    })
    wiredStoryTypes({ error, data }) {
        if (data) {
            this.storyTypes = data.values.map(entry => ({
                label: entry.label,
                value: entry.value,
                class: this.selectedStoryType === entry.value ? 'iab-clickable-badge iab-badge-selected' : 'iab-clickable-badge'
            }));
        } else if (error) {
            console.error('Error loading Story Type picklist values', error);
        }
    }



    // retrieve all stories in the release
    @wire(getStoriesForRelease, { 
        ParamReleaseId: '$recordId'
    })
    wiredStories(result) {
        this.wiredStoriesResult = result; // store the result for refresh
        const { data, error } = result;

        if (data) {
            this.allStories = data.map(story => ({
                ...story,
                Story_Url: `/lightning/r/iab__Story__c/${story.Id}/view`,
                Is_Defect: story.iab__Story_Type__c === 'Defect'
            }));
            this.applyFilters();
        } else if (error) {
            console.error('Error loading stories', error);
        }
    }



    // retrieve all unique tags for stories in the release
    @wire(getTagsForRelease, {
        ParamReleaseId: '$recordId'
    })
    wiredTags({ error, data }) {
        if (data) {
            const noTagsBadge = {
                Id: '__NO_TAGS__',
                Name: this.label.KanbanFilterValueStoriesWithoutTags,
                class: this.selectedTags.has('__NO_TAGS__') ? 'iab-clickable-badge iab-badge-selected' : 'iab-clickable-badge'
            };

            const realTags = data.map(tag => ({
                ...tag,
                class: this.selectedTags.has(tag.Id) ? 'iab-clickable-badge iab-badge-selected' : 'iab-clickable-badge'
            }));

            this.tags = [noTagsBadge, ...realTags];
        } else if (error) {
            console.error('Error loading tags', error);
        }
    }



    // ======================================
    // EVENT HANDLER METHODS
    // ======================================

    // filters the story cards on the Kanban whenever a new Assigned Project Member is selected
    handleAssigneeSelect(event) {
        const userId = event.target.dataset.userid;

        // if already selected, deselect it (toggle off)
        if (this.selectedAssignees.has(userId)) {
            this.selectedAssignees.clear();
        } else {
            this.selectedAssignees.clear();
            this.selectedAssignees.add(userId);
        }

        // update visual state of badges
        this.assignedUsers = this.assignedUsers.map(user => ({
            ...user,
            class: this.selectedAssignees.has(user.Id) ? 'iab-clickable-badge iab-badge-selected' : 'iab-clickable-badge'
        }));

        this.applyFilters();
    }
    
    
    
    // allows status column in the Kanban to be used as a drop target
    handleDragOver(event) {
        event.preventDefault();
    }

    
    
    // stores the recordId of the Story being dragged, to be used once dropped
    handleDragStart(event) {
        const storyId = event.target.dataset.id;
        event.dataTransfer.setData('storyId', storyId);
    }



    // updates story status and persists the change once the selected story card has been dropped
    handleDrop(event) {
        event.preventDefault();
        const storyId = event.dataTransfer.getData('storyId');

        // traverse up the DOM tree to find the element with data-status
        let target = event.target;
        while (target && !target.dataset.status) {
            target = target.parentElement;
        }

        const newStatus = target ? target.dataset.status : null;

        if (!newStatus) {
            console.warn('Drop target missing data-status attribute.');
            return;
        }

        const newStatusLabel = target ? target.dataset.label : null;

        const story = this.allStories.find(s => s.Id === storyId);
        if (story && story.iab__Status__c !== newStatus) {
            const originalStatus = story.iab__Status__c;
            story.iab__Status__c = newStatus;
            moveStory({ ParamStoryId: storyId, ParamNewStatus: newStatus })
                .then(() => {
                    this.applyFilters();
                    this.dispatchEvent(new ShowToastEvent({
                        title: this.label.ActionMoveStorySuccessTitle,
                        message: this.label.ActionMoveStorySuccessMessage + ' ' + newStatusLabel + '.',
                        variant: 'success',
                        mode: 'dismissable'
                    }));
                })
                .catch(error => {
                    // revert status on failure
                    story.iab__Status__c = originalStatus;
                    this.dispatchEvent(new ShowToastEvent({
                        title: this.label.ActionMoveStoryErrorTitle,
                        message: error.body?.message || 'An unexpected error occurred.',
                        variant: 'error',
                        mode: 'sticky'
                    }));
                });
        }
    }



    // toggles the height of all Kanban columns between the default height
    // and auto (which will display all cards without scrolling)
    handleExpandKanban(event) {
        this.isKanbanExpanded = !this.isKanbanExpanded;

        if(this.isKanbanExpanded) {
            this.columnStyle = 'height: auto;';
            this.expandKanbanButtonIcon = 'utility:collapse_all';
        }
        else {
            this.columnStyle = `height: ${this.kanbanHeight};`;
            this.expandKanbanButtonIcon = 'utility:expand_all';
        }
    }



    // toggles Story cards to display only expedited stories or not
    handleExpeditedToggle(event) {
        this.showOnlyExpedited = event.target.checked;
        this.applyFilters();
    }



    // resets all filters and search input to display all available story cards on the Kanban
    handleSearchFilterReset() {
        this.searchKey = '';
        this.selectedTags.clear();
        this.showOnlyExpedited = false;

        // reset the visual state of all story type badges
        this.selectedStoryType = null;
        this.storyTypes = this.storyTypes.map(type => ({
            ...type,
            class: 'iab-clickable-badge'
        }));
        
        // reset the visual state of all tag badges
        this.tags = this.tags.map(tag => ({
            ...tag,
            class: 'iab-clickable-badge'
        }));

        // reset the visual state of all assignee badges
        this.selectedAssignees.clear();
        this.assignedUsers = this.assignedUsers.map(user => ({
            ...user,
            class: 'iab-clickable-badge'
        }));

        this.applyFilters();
    }



    // filters the Story data based on the user's input on the filter/search card as they type
    handleStorySearch(event) {
        this.searchKey = event.target.value;
        this.applyFilters();
    }



    handleStoryTypeSelect(event) {
        const selected = event.target.dataset.type;

        if (this.selectedStoryType === selected) {
            this.selectedStoryType = null; // deselect if same
        } else {
            this.selectedStoryType = selected;
        }

        // rebuild visual classes
        this.storyTypes = this.storyTypes.map(type => ({
            ...type,
            class: this.selectedStoryType === type.value ? 'iab-clickable-badge iab-badge-selected' : 'iab-clickable-badge'
        }));

        this.applyFilters();
    }



    // filters the story cards on the Kanban whenever a new Tag is selected
    handleTagSelect(event) {
        const tagId = event.target.dataset.tag;

        if (tagId === '__NO_TAGS__') {
            // toggle '__NO_TAGS__' selection
            if (this.selectedTags.has('__NO_TAGS__')) {
                this.selectedTags.delete('__NO_TAGS__');
            } else {
                this.selectedTags.clear(); // deselect others
                this.selectedTags.add('__NO_TAGS__');
            }
        } else {
            // toggle regular tag
            if (this.selectedTags.has(tagId)) {
                this.selectedTags.delete(tagId);
            } else {
                this.selectedTags.delete('__NO_TAGS__'); // deselect special tag if present
                this.selectedTags.add(tagId);
            }
        }

        // rebuild tag classes
        this.tags = this.tags.map(tag => ({
            ...tag,
            class: this.selectedTags.has(tag.Id) ? 'iab-clickable-badge iab-badge-selected' : 'iab-clickable-badge'
        }));

        this.applyFilters();
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
            // if modal closed with X button, promise returns result = 'undefined'
            // if modal closed with OK button, promise returns result = 'okay'
            // if modal closed when a flow finishes, promise returns result = 'okay'
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
            // if modal closed with X button, promise returns result = 'undefined'
            // if modal closed with OK button, promise returns result = 'okay'
            // if modal closed when a flow finishes, promise returns result = 'okay'
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
            // if modal closed with X button, promise returns result = 'undefined'
            // if modal closed with OK button, promise returns result = 'okay'
            // if modal closed when a flow finishes, promise returns result = 'okay'
            refreshApex(this.wiredStories);
        });
    }



    // refreshes the Story data in the Kanban when the refresh icon button is clicked
    refreshKanban() {
        if (this.wiredStoriesResult) {
            refreshApex(this.wiredStoriesResult)
                .then(() => {
                    // optionally reapply filters if needed
                    this.applyFilters();
                })
                .catch(error => {
                    console.error('Error refreshing Kanban board:', error);
                });
        }
    }



    // shows or hides the filter/search card on the Kanban when the filter button is clicked
    toggleFilters() {
        if (this.showFilters) {
            const el = this.template.querySelector('.iab-filter-card');
            if (el) {
                const height = `${el.scrollHeight}px`;
                this.animateHeight(el, {
                    from: height,
                    to: '0px',
                    done: () => {
                        this.showFilters = false;
                    }
                });
            } else {
                this.showFilters = false;
            }
        } else {
            // first trigger DOM render
            this.renderAndAnimateFilter = true;
            this.showFilters = true;
        }
    }



    // ======================================
    // PRIVATE HELPER METHODS
    // ======================================

    // handles the animation of the search/filter card when it is expanded or collapsed
    animateHeight(element, { from, to, done }) {
        if (!element) return;

        element.style.maxHeight = from;
        element.style.opacity = from === '0px' ? '0' : '1';
        element.style.overflow = 'hidden';

        requestAnimationFrame(() => {
            element.style.transition = 'max-height 0.3s ease, opacity 0.3s ease';
            element.style.maxHeight = to;
            element.style.opacity = to === '0px' ? '0' : '1';

            setTimeout(() => {
                element.style.transition = '';
                element.style.maxHeight = '';
                element.style.overflow = '';
                if (done) done();
            }, 300);
        });
    }
    


    // uses current search text and selected filters to filter the Kanban to matching story cards
    applyFilters() {
        const searchKey = this.searchKey.toLowerCase();
        const tags = this.selectedTags;

        const filtered = this.allStories.filter(story => {
            
            // match on text search
            // searches Name, Story Description, and Story Number
            const matchesSearch = !searchKey || (story.Name || '').toLowerCase().includes(searchKey) || (story.iab__Story_Description__c || '').toLowerCase().includes(searchKey) || (story.iab__Story_Number__c || '').toLowerCase().includes(searchKey);
            
            let matchesExpedited = true;
            if (this.showOnlyExpedited) {
                matchesExpedited = story.iab__Expedite__c === true;
            }

            // match on Story Type
            let matchesStoryType = true;
            if (this.selectedStoryType) {
                matchesStoryType = story.iab__Story_Type__c === this.selectedStoryType;
            }

            // match on tag selection
            const storyTagIds = (story.iab__Tag_Assignments__r || [])
                .map(t => t.iab__Tag__c)
                .filter(Boolean);
            
            let matchesTags = true;

            if (tags.size > 0) {
                if (tags.has('__NO_TAGS__')) {
                    // only show stories with no tags
                    matchesTags = storyTagIds.length === 0 && tags.size === 1;
                } else {
                    // all selected tags must be present in story
                    matchesTags = [...tags].every(tagId => storyTagIds.includes(tagId));
                }
            }

            // match on assigned project member
            const assignees = this.selectedAssignees;
            let matchesAssignee = true;

            if (assignees.size > 0) {
                const assignedTo = story.iab__Assigned__c;

                if (assignees.has('__UNASSIGNED__')) {
                    matchesAssignee = !assignedTo && assignees.size === 1;
                } else {
                    matchesAssignee = assignedTo && assignees.has(assignedTo);
                }
            }
            
            return matchesSearch && matchesExpedited && matchesStoryType && matchesTags && matchesAssignee;
        });

        this.filteredStories = filtered;
        this.assignStoriesToColumns();
    }



    // sorts stories into Kanban columns according to their status
    assignStoriesToColumns() {
        this.columns.forEach(col => col.stories = []);
        this.filteredStories.forEach(story => {
            const col = this.columns.find(c => c.value === story.iab__Status__c);
            if (col) col.stories.push(story);
        });
    }



    // creates a bold color palette for formatting story cards in different columns/status values
    // requires RGB values for each color so they can be easily lightened by lightencolor()
    generateColor(index) {
        const colors = [
            "rgb(249, 65, 68)",    // #f94144 red
            "rgb(243, 114, 44)",   // #f3722c orange
            "rgb(249, 199, 79)",   // #f9c74f yellow
            "rgb(144, 190, 109)",  // #90be6d light green
            "rgb(67, 170, 139)",   // #43aa8b teal
            "rgb(77, 144, 142)",   // #4d908e green-cyan
            "rgb(87, 117, 144)",   // #577590 blue-grey
            "rgb(90, 94, 166)",    // #5a5ea6 indigo
            "rgb(119, 75, 189)",   // #774bbd purple
            "rgb(186, 80, 177)"    // #ba50b1 magenta
        ];
        return colors[index % colors.length];
    }



    // lightens the color palette from generateColor() so they can be used as background colors for story cards
    // only accepts RGB values
    lightenColor(rgbString, percent = 0.85) {
        const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!match) return rgbString;

        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        const b = parseInt(match[3], 10);

        const newR = Math.round(r + (255 - r) * percent);
        const newG = Math.round(g + (255 - g) * percent);
        const newB = Math.round(b + (255 - b) * percent);

        return `rgb(${newR}, ${newG}, ${newB})`;
    }

}