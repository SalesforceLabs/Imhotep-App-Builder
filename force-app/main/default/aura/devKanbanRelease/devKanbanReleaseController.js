// *******************************************************************************************
// @Name			devKanbanRelease.cmp
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date			04/11/2022
// @Description	    Displays a drag-and-drop Kanban for a release's stories.
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
// 05/25/2024   Mitch Lynch     S000494     Reworked the component to work in the new org.  Removed design attribute (previously deprecated in old package).
//
// LEGACY ORG PACKAGE CHANGES:
// 02/22/2024   Mitch Lynch     S000430     Modified to use custom labels, such as {!$Label.c.GeneralModalCloseLabel}.
// 02/21/2024   Mitch Lynch     S000436     Commented out all console.log() methods used for debugging.
// 02/20/2024   Mitch Lynch     S000437     Standardized button and icon attributes for accessibility.
// 08/24/2023   Mitch Lynch     S-000371    Adjusted formatting to fix border definition around header div, like in imhotepStoryList LWC.
// 05/23/2023   Mitch Lynch     S-000306    Reintroduced the NewStoryFlow attribute due to failing package upgrades (has to be present for orgs where previously installed).
// 05/19/2023   Mitch Lynch     S-000304    Reduced the padding in the header and switched to using SLDS standard padding.
// 03/07/2023   Mitch Lynch     S-000298    Adjusted to retrieve Flow API Names from the custom metadata type instead of being set as design attributes.  To update the Release record type, see the active imhotep__Imhotep_App_Builder_Setting__mdt custom metadata type record.
// 03/07/2023   Mitch Lynch     S-000188    Added "Add Template Stories" button to initiate the related flow (imhotep__Imhotep_Release_AddTemplateToRelease).
// 02/25/2023   Mitch Lynch     S-000183    Updated controller from ImhotepReleaseKanbanCtrl to ImhotepAppBuilderCtrl.
// 02/24/2023   Mitch Lynch     S-000180    Renamed controller from devReleaseKanbanCtrl to ImhotepReleaseKanbanCtrl.
// 02/24/2023   Mitch Lynch     000079      Updated imhotep__Assigned__c to use imhotep__Assigned_Project_Member__c.
// 02/21/2023   Mitch Lynch     S-000166    Updated to use namespace "imhotep".
// 10/24/2022   Mitch Lynch     S-000101    Added toast event for successfully updated cards (upon drag-and-drop).
// 10/24/2022   Mitch Lynch     S-000101    Updated so that cards are only draggable if the user has edit access (now controlled by UserHasEditAccessToRelease).
// 10/24/2022   Mitch Lynch     S-000101    Dropped story cards are now saved with an updated status; after update, the Apex queries run to update the Kanban.
// 10/23/2022   Mitch Lynch     S-000101    Copied devReleaseKanban and are now experimenting with a drag-and-drop version of the component.
// 10/21/2022   Mitch Lynch     S-000096	Implemented lightning:formattedUrl for URLs so that records open in the console without refreshing the browser (faster).
// 10/20/2022   Mitch Lynch     S-000092	Updated to replace the "In Progress" status with "Building" in the test data, replace the "Ready to Deploy" status with "Ready" in the test data, add records for the new "Testing" status, and remove records for the retired "Accepted" status, to reflect picklist value changes in the Story__c.Status__c field.
// 10/14/2022   Mitch Lynch     S-000010	Updated default value for NewStoryFlow attribute to Imhotep_Release_NewStory.
// 09/28/2022   Mitch Lynch     000060		Added a refresh icon button.
// 09/28/2022   Mitch Lynch     000072		Used SLDS Grid System classes with layoutitems to make them responsive for mobile, tablet, and desktop.
// 09/25/2022   Mitch Lynch     000064		Finished promotion/demotion Apex. Made promote/demote actions conditional based on whether user has edit access to the Release. Completed test class (no coverage for checkUserEditAccess yet).
// 09/24/2022   Mitch Lynch     000064		Adding promote/demote button icons to the Story card layout for changing status of the Story.
// 09/24/2022   Mitch Lynch     000059		Fixed typo in Expedited icon's tooltip.
// 07/08/2022   Mitch Lynch     S-00033		Made the New Story flow button configurable. Reordered the columns so that Blocked is the first column (S-00035).
// 04/20/2022   Mitch Lynch     unknown		Added assigned user's name to Kanban story cards; updated how points display.
// 04/14/2022   Mitch Lynch     unknown		Added force:refreshView; fixed runFlow action to pass recordId as an input variable; adjusted card for Deployed stories to show estimated and actual points, like Accepted stories; added icon for defect stories; modified expedited icon.
// 04/11/2022   Mitch Lynch     unknown		Created base component.
// *******************************************************************************************
// NOTES
// This component, including any referenced resources including but not limited to components, Apex controllers, objects, fields, and static resources, was developed by Mitch Lynch for Salesforce.com.  Use only with permission.
//
// Things left to do:
//      - Set a toast message when a card is successfully dropped onto a new column.
//      - Make the dropping of the card more immediate in the UI; currently we re-query to display an updated card and it takes a while. The other component seems to just remove and add it from one list of records to another without having to query. I think this is happening on lines 98-109 (childChanged method of HomeChildKanbanController.js - https://github.com/SalesforceLabs/Home-Child-Kanban/blob/master/src/aura/HomeChildKanban/HomeChildKanbanController.js))
//
// *******************************************************************************************

({
    doInit : function(component, event) {
        
        // Check to see if user has edit access to the release
        var userId = $A.get("$SObjectType.CurrentUser.Id");
        var action = component.get("c.checkUserEditAccess");
        action.setParams({
            ParamReleaseId : component.get("v.recordId"),
            ParamUserId : userId
        })
        action.setCallback(this, function(data) {
            component.set("v.UserHasEditAccessToRelease", data.getReturnValue());
            // console.log(data.getReturnValue());
        });
        console.log("Call Apex action - check if user has edit access");
        $A.enqueueAction(action);


        // Retrieve Flow API names from custom metadata type
        // Custom Metadata Type:  iab__Imhotep_Config__mdt
        var actionImhotepActiveMetadata = component.get("c.getImhotepActiveMetadata");
        actionImhotepActiveMetadata.setCallback(this, function(data) {
            component.set("v.ImhotepActiveMetadata", data.getReturnValue());
            // console.log(data.getReturnValue());
        });
        $A.enqueueAction(actionImhotepActiveMetadata);


        // Get all stories as a list of lists by status
		var actionAllStories = component.get("c.getStoriesByStatus");
        actionAllStories.setParams({
            ParamReleaseId : component.get("v.recordId")
        })
        actionAllStories.setCallback(this, function(response) {
            var state = response.getState();
            if(component.isValid && state === "SUCCESS") {
                var responseValue = response.getReturnValue();
                
                // Get all Stories where iab__Status__c == Blocked
                component.set("v.BlockedStoryRecords", responseValue[0]);
                
                // Get all Stories where iab__Status__c == Defined
                component.set("v.DefinedStoryRecords", responseValue[1]);
                
                // Get all Stories where iab__Status__c == Building
                component.set("v.BuildingStoryRecords", responseValue[2]);
                
                // Get all Stories where iab__Status__c == Testing
                component.set("v.TestingStoryRecords", responseValue[3]);
                
                // Get all Stories where iab__Status__c == Ready
                component.set("v.ReadyStoryRecords", responseValue[4]);
                
                // Get all Stories where iab__Status__c == Deployed
                component.set("v.DeployedStoryRecords", responseValue[5]);
            }
        });
        $A.enqueueAction(actionAllStories);

    },


    // for dragged card - starts when the dragging starts
    // trigger: ondragstart
    startDrag : function(component, event) {
        
        component.set("v.DragStoryId", event.currentTarget.id);
        component.set("v.DragStoryOriginalStatus", event.currentTarget.getAttribute('data-originalstatus'));

    },
    

    // for drop zone - allows drag over a drop zone
    // trigger: ondragover
    allowDrag : function(component, event) {
        
        event.preventDefault();

        // this is just for testing - remove this and the attribute when complete
        component.set("v.DragDropZone", event.currentTarget.id);

    },
    

    // for drop zone - allows card to be moved to new column/status
    // trigger:  ondrop
    dropStoryCard : function(component, event) {
        
        event.preventDefault();

        var story = component.get("v.DragStoryId");
        var originalstatus = component.get("v.DragStoryOriginalStatus");
        var newstatus = event.currentTarget.id;

        // console.log("story = " + story);
        // console.log("originalstatus = " + originalstatus);
        // console.log("newstatus = " + newstatus);

        if(newstatus != originalstatus) {
            // console.log("newstatus is new!");

            // update story's status
            var action = component.get("c.moveStory");
            action.setParams({
                ParamStoryId : story,
                ParamNewStatus : newstatus
            })
            action.setCallback(this, function(response) {
                var state = response.getState();
                if(component.isValid() && state == "SUCCESS"){
                    // console.log("Call Apex action - move story");
                    var updatedstatus = response.getReturnValue();
                    // console.log("updatedstatus is " + updatedstatus);
                    
                    // refresh page
                    $A.get('e.force:refreshView').fire();

                    // fire off a toast message
                    var toastEvent = $A.get("e.force:showToast");
                    var toastMessage = 'Story was moved from ' + originalstatus + ' to ' + newstatus + ' successfully.';
                    toastEvent.setParams({
                        "title": "Success!",
                        "message": toastMessage,
                        "type": "success"
                    });
                    toastEvent.fire();
                } else {
                    console.log('There was a problem : '+response.getError());
                }
            });
            $A.enqueueAction(action);  
        }

        // unset the attributes
        component.set("v.DragStoryId", null);
        component.set("v.DragStoryOriginalStatus", null);
        component.set("v.DragDropZone", null);

    },
    
    
    // runs a designated flow
    runFlow : function(component, event) {
        
        let flowName = event.getSource().get( "v.name" );
        
        component.set( "v.showModal", true );

        $A.createComponent(
            "lightning:flow",
            {
                "onstatuschange": component.getReference( "c.hideModal" )
            },
            ( flow, status, errorMessage ) => {
                if ( status === "SUCCESS" ) {
                    component.set( "v.body", flow );
                    component.set( "v.flow", flow );
                	flow.startFlow( flowName );
                }
            }
        );

    },
    
    
    // runs a designated flow and provide recordId as an input variable
    runFlowRecordSensitive : function(component, event) {
        
        // get the recordId for the current record (if any)
        var recordId = component.get("v.recordId");
        
        let flowName = event.getSource().get( "v.name" );

        component.set( "v.showModal", true );

        $A.createComponent(
            "lightning:flow",
            {
                "onstatuschange": component.getReference( "c.hideModal" )
            },
            ( flow, status, errorMessage ) => {
                if ( status === "SUCCESS" ) {
                    component.set( "v.body", flow );
                    component.set( "v.flow", flow );
                	var inputVariables = [{name : "recordId", type : "String", value: recordId}];
            		
            		flow.startFlow( flowName, inputVariables );
                }
            }
        );

    },
    
    
	// hides flow modal
    hideModal : function(component, event) {
        
        if ( event.getParam( "status" ).indexOf( "FINISHED" ) !== -1 ) {
            component.set( "v.showModal", false );
            component.get( "v.flow" ).destroy();
            $A.get('e.force:refreshView').fire();
        }

    },
    
    
    // closes the flow modal when user clicks the close button
    closeModal : function( component, event, helper ) {
        
        component.set( "v.showModal", false );
        component.get( "v.flow" ).destroy();

    }
    
})