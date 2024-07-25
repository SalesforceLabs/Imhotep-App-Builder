// *******************************************************************************************
// @Name			devProjectTiles.cmp
// @Author		Mitch Lynch (mitch.lynch@salesforce.com)
// @Date			09/25/2022
// @Description	Displays tile menu for all Projects.
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
// 05/25/2024   Mitch Lynch     S000515     Reworked the component to work in the new org.  Deleted design attributes (previously deprecated in legacy org).
//
// LEGACY ORG PACKAGE CHANGES:
// 02/24/2024   Mitch Lynch     S000430     Modified to use custom labels, such as {!$Label.c.GeneralModalCloseLabel}.
// 02/21/2024   Mitch Lynch     S000436     Commented out all console.log() methods used for debugging.
// 02/19/2024   Mitch Lynch     S000437     Standardized button attributes for accessibility.
// 08/26/2023   Mitch Lynch     S-000386    Added refresh icon button to refresh the component's data manually (calls doInit()).
// 06/21/2023   Mitch Lynch     S-000330    Updated to pass the name of the new project flow and the name of the tab to the devProjectTileTab component to help display an appropriate empty state.
// 05/23/2023   Mitch Lynch     S-000306    Reintroduced the NewProjectFlow and NewReleaseFlow attributes due to failing package upgrades (have to be present for orgs where previously installed).
// 05/19/2023   Mitch Lynch     S-000304    Reduced the padding in the header and switched to using SLDS standard padding.
// 03/07/2023   Mitch Lynch     S-000298    Adjusted to retrieve Flow API Names from the custom metadata type instead of being set as design attributes.  To update the Release record type, see the active imhotep__Imhotep_App_Builder_Setting__mdt custom metadata type record.
// 03/07/2023   Mitch Lynch     S-000188    Added support for the "New Release From Template" button.
// 02/28/2023   Mitch Lynch     S-000183    Rewrote getProjectsByMembership() so that Aura controller finds and passes the current user Id as a parameter to the Apex method so it would be testable.
// 02/25/2023   Mitch Lynch     S-000183    Replace controller ImhotepProjectsCtrl with ImhotepAppBuilderCtrl.
// 02/24/2023   Mitch Lynch     S-000180    Renamed controller from devProjectsCtrl to ImhotepProjectsCtrl.
// 02/21/2023   Mitch Lynch     S-000166    Updated to use namespace "imhotep".
// 10/14/2022	Mitch Lynch		000053		Updated to query Projects through Project_Member__c records for the current user. Updated default value of NewProjectFlow to Imhotep_General_NewProject and NewReleaseFlow to Imhotep_Project_NewRelease.
// 09/28/2022	Mitch Lynch		000070		Modified to use a tabbed layout by Project Status__c. Rewrote project query as a list of lists. Moved each set of project to a child component to avoid duplicative code.
// 09/26/2022	Mitch Lynch		000070		Continued base component development.
// 09/25/2022	Mitch Lynch		000070		Created base component.
// *******************************************************************************************
// NOTES
// This component, including any referenced resources including but not limited to components, Apex controllers, objects, fields, and static resources, was developed by Mitch Lynch for Salesforce.com.  Use only with permission.
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