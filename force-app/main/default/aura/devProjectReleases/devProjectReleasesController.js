// *******************************************************************************************
// @Name			devProjectReleases.cmp
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date			10/16/2022
// @Description	    DEPRECATED. Displays list of Releases for a Project.
// @Used            DEPRECATED / NOT IN USE
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