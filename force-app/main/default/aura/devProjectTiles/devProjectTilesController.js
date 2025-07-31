// *******************************************************************************************
// @Name			devProjectTiles.cmp
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date			09/25/2022
// @Description	    DEPRECATED, use imhotepMyProjects LWC instead. Displays tile menu for all Projects.
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
    doInit : function(component, event, helper) {
        
        // Retrieve Flow API names from custom metadata type
        // Custom Metadata Type:  iab__Imhotep_App_Builder_Setting__mdt
        var actionImhotepActiveMetadata = component.get("c.getImhotepActiveMetadata");
        actionImhotepActiveMetadata.setCallback(this, function(data) {
            component.set("v.ImhotepActiveMetadata", data.getReturnValue());
            // console.log(data.getReturnValue());
        });
        $A.enqueueAction(actionImhotepActiveMetadata);


        // Get all Projects as a list of lists
        var userId = $A.get("$SObjectType.CurrentUser.Id");
		var actionAllProjects = component.get("c.getProjectsByMembership");
        actionAllProjects.setParams({
            ParamUserId : userId
        })
        actionAllProjects.setCallback(this, function(response) {
            // console.log('We have a callback for actionAllProjects!');
            // console.log('Response Vals: [' + response.getReturnValue() + ']');
            
            var state = response.getState();
            if(component.isValid && state === "SUCCESS") {
                var responseValue = response.getReturnValue();
                
                // Get all Projects where iab__Status__c = Planning
                component.set("v.PlanningProjectRecords", responseValue[0]);
                
                // Get all Projects where iab__Status__c = Active
                component.set("v.ActiveProjectRecords", responseValue[1]);
                
                // Get all Projects where iab__Status__c = Completed
                component.set("v.CompletedProjectRecords", responseValue[2]);
            }
        });
        // console.log("Call Apex actionAllProjects - get all projects");
        $A.enqueueAction(actionAllProjects);
        
        
        // Get Active Release records
        var action2 = component.get("c.getAllReleases");
        action2.setParams({
            ParamReleaseStatus : 'Active',
            ParamIsBacklog : 'false'
        })
        action2.setCallback(this, function(data) {
            component.set("v.ActiveReleaseRecords", data.getReturnValue());
            // console.log(data.getReturnValue());
        });
        // console.log("Call Apex action2 - get active releases");
        $A.enqueueAction(action2);
        
        
        // Get Planning Release records
        var action3 = component.get("c.getAllReleases");
        action3.setParams({
            ParamReleaseStatus : 'Planning',
            ParamIsBacklog : 'false'
        })
        action3.setCallback(this, function(data) {
            component.set("v.PlanningReleaseRecords", data.getReturnValue());
            // console.log(data.getReturnValue());
        });
        // console.log("Call Apex action3 - get planning releases");
        $A.enqueueAction(action3);
        
        
        // Get Backlog Release records
        var action4 = component.get("c.getAllReleases");
        action4.setParams({
            ParamReleaseStatus : 'Planning',
            ParamIsBacklog : 'true'
        })
        action4.setCallback(this, function(data) {
            component.set("v.BacklogReleaseRecords", data.getReturnValue());
            // console.log(data.getReturnValue());
        });
        // console.log("Call Apex action4 - get backlog releases");
        $A.enqueueAction(action4);
    },
    
    
    
    // runs a designated flow
    runFlow : function(component, event) {
        
        let flowName = event.getSource().get("v.name");

        component.set("v.showModal", true);

        $A.createComponent(
            "lightning:flow",
            {
                "onstatuschange": component.getReference("c.hideModal")
            },
            (flow, status, errorMessage) => {
                if ( status === "SUCCESS") {
                    component.set("v.body", flow);
                    component.set("v.flow", flow);
                	flow.startFlow(flowName);
                }
            }
        );
    },
    
    
	
    // hides flow modal
    hideModal : function(component, event) {
        if ( event.getParam("status").indexOf("FINISHED") !== -1 ) {
            component.set("v.showModal", false);
            component.get("v.flow").destroy();
            $A.get('e.force:refreshView').fire();
        }
    },
    
    
    
    // closes the flow modal when user clicks the close button
    closeModal : function(component) {
        component.set("v.showModal", false);
        component.get("v.flow").destroy();
    }
})