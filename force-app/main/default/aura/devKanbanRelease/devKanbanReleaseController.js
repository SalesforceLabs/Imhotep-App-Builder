// *******************************************************************************************
// @Name			devKanbanRelease.cmp
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date			04/11/2022
// @Description	    DEPRECATED, use imhotepStoryKanban LWC instead. Displays a drag-and-drop Kanban for a release's stories.
// @Use             DEPRECATED / NOT IN USE
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
        // console.log("Call Apex action - check if user has edit access");
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