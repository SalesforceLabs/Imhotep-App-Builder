// *******************************************************************************************
// @Name			devProjectReleases.cmp
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date			10/16/2022
// @Description	    Displays list of Releases for a Project.
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
// 05/26/2024   Mitch Lynch     S000532     Reworked the component to work in the new org. Deleted the design file (deprecated in the legacy org).
//
// LEGACY ORG PACKAGE CHANGES:
// 02/24/2024   Mitch Lynch     S000430     Modified to use custom labels, such as {!$Label.c.GeneralModalCloseLabel}.
// 02/21/2024   Mitch Lynch     S000436     Commented out all console.log() methods used for debugging.
// 02/19/2024   Mitch Lynch     S000437     Standardized button and icon attributes for accessibility.
// 06/24/2023   Mitch Lynch     S-000330    Added v.ReleaseRecordCount attribute and an empty state based on the SLDS Illustration blueprint.
// 06/09/2023   Mitch Lynch     S-000327    Added <design:supportedFormFactors> tag to xml config file to allow component to be used in both large and small form factors.
// 05/23/2023   Mitch Lynch     S-000306    Reintroduced the AddFlowAPIName attribute due to failing package upgrades (has to be present for orgs where previously installed).
// 03/07/2023   Mitch Lynch     S-000298    Adjusted to retrieve Flow API Names from the custom metadata type instead of being set as design attributes.  To update the Release record type, see the active imhotep__Imhotep_App_Builder_Setting__mdt custom metadata type record.
// 03/07/2023   Mitch Lynch     S-000188    Added support for the "New Release From Template" button.
// 02/25/2023   Mitch Lynch     S-000183    Replace controller ImhotepProjectsCtrl with ImhotepAppBuilderCtrl.
// 02/24/2023   Mitch Lynch     S-000180    Renamed controller from devProjectsCtrl to ImhotepProjectsCtrl.
// 02/21/2023   Mitch Lynch     S-000166    Updated to use namespace "imhotep".
// 10/23/2022   Mitch Lynch     S-000096    Updated to use the new devReleaseTile component to maximize reuse of tile markup and to implement lightning:navigation.
// 10/22/2022	Mitch Lynch		S-00010		Reformatted to look like a related list card, using the SLDS Page Header (Inside a Card) Blueprint.
// 10/16/2022	Mitch Lynch		S-00010		Created base component.
// *******************************************************************************************
// NOTES
// This component, including any referenced resources including but not limited to components, Apex controllers, objects, fields, and static resources, was developed by Mitch Lynch for Salesforce.com.  Use only with permission.
//
// SLDS Page Header (Inside a Card) Blueprint:  https://www.lightningdesignsystem.com/components/page-headers/?variant=base#Inside-a-card
// *******************************************************************************************

({
	doInit : function(component) {

        // Retrieve Flow API names from custom metadata type
        // Custom Metadata Type:  iab__Imhotep_Config__mdt
        var actionImhotepActiveMetadata = component.get("c.getImhotepActiveMetadata");
        actionImhotepActiveMetadata.setCallback(this, function(data) {
            component.set("v.ImhotepActiveMetadata", data.getReturnValue());
            // console.log(data.getReturnValue());
        });
        $A.enqueueAction(actionImhotepActiveMetadata);


        
        // Get all Releases as a list of lists
		var actionAllReleases = component.get("c.getReleaseLists");
        actionAllReleases.setParams({
            ParamProjectId : component.get("v.recordId")
        })
        actionAllReleases.setCallback(this, function(response) {
            var state = response.getState();
            if(component.isValid && state === "SUCCESS") {
                var responseValue = response.getReturnValue();

                // count returned Release records
                var releaseCount = responseValue[0].length + responseValue[1].length + responseValue[2].length + responseValue[3].length;
                component.set("v.ReleaseRecordCount", releaseCount);
                
                // Get all Releases where iab__Status__c == Planning
                component.set("v.PlanningReleaseRecords", responseValue[0]);
                
                // Get all Releases where iab__Status__c == Active
                component.set("v.ActiveReleaseRecords", responseValue[1]);
                
                // Get all Releases where iab__Status__c == Completed
                component.set("v.AcceptedReleaseRecords", responseValue[2]);
                
                // Get all Releases where iab__Is_Backlog == TRUE
                component.set("v.BacklogReleaseRecords", responseValue[3]);
            }
        });
        $A.enqueueAction(actionAllReleases);
        
    },
    
    
    
    // runs a designated flow to create a new iab__Release__c record
    runFlowToAdd : function(component, event) {
        
        let recordId = component.get("v.recordId");
        let flowName = component.get("v.ImhotepActiveMetadata.iab__Project_New_Release__c");

        component.set("v.showModal", true);

        $A.createComponent(
            "lightning:flow",
            {
                "onstatuschange": component.getReference("c.hideModal")
            },
            (flow, status, errorMessage) => {
                if ( status === "SUCCESS") {
                    component.set("v.body",flow);
                    component.set("v.flow",flow);
                	var inputVariables = [{name:"recordId",type:"String",value:recordId}];
                	flow.startFlow(flowName,inputVariables);
                }
            }
        );
    },
    
    
    
    // runs a designated flow to create a new iab__Release__c record and related stories from a template
    runFlowToAddFromTemplate : function(component, event) {
        
        let recordId = component.get("v.recordId");
        let flowName = component.get("v.ImhotepActiveMetadata.iab__Project_Create_Release_from_Template__c");

        component.set("v.showModal", true);

        $A.createComponent(
            "lightning:flow",
            {
                "onstatuschange": component.getReference("c.hideModal")
            },
            (flow, status, errorMessage) => {
                if ( status === "SUCCESS") {
                    component.set("v.body",flow);
                    component.set("v.flow",flow);
                	var inputVariables = [{name:"recordId",type:"String",value:recordId}];
                	flow.startFlow(flowName,inputVariables);
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