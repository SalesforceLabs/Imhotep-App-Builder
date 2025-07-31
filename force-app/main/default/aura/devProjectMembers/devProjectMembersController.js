// *******************************************************************************************
// @Name			devProjectMembers.cmp
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date			10/15/2022
// @Description	    DEPRECATED, use imhotepProjectMembers LWC instead. Displays list of Project Members for a Project.
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
	doInit : function(component) {
        
        // Get Project Members
        var action = component.get("c.getProjectMembers");
        action.setParams({
            ParamProjectId : component.get("v.recordId")
        })
        action.setCallback(this, function(data) {
            component.set("v.ProjectMemberRecords", data.getReturnValue());
            // console.log(data.getReturnValue());
        });
        // console.log("Call Apex action - get project members");
        $A.enqueueAction(action);


        // Retrieve Flow API names from custom metadata type
        // Custom Metadata Type:  iab__Imhotep_Config__mdt
        var actionImhotepActiveMetadata = component.get("c.getImhotepActiveMetadata");
        actionImhotepActiveMetadata.setCallback(this, function(data) {
            component.set("v.ImhotepActiveMetadata", data.getReturnValue());
            // console.log(data.getReturnValue());
        });
        $A.enqueueAction(actionImhotepActiveMetadata);
        
    },
    
    
    
    // runs a designated flow to create a new iab__Project_Member__c record
    runFlowToAdd : function(component, event) {
        
        let recordId = component.get("v.recordId");
        let flowName = component.get("v.ImhotepActiveMetadata.iab__Project_New_Project_Member__c");

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
    
    
    
    // runs a designated flow to modify the iab__Project_Member__c record
    runFlowToModify : function(component, event) {
        
        let recordId = event.getSource().get("v.name");
        let flowName = component.get("v.ImhotepActiveMetadata.iab__Project_Update_Project_Member__c");

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
    
    
    
    // runs a designated flow to delete the iab__Project_Member__c record
    runFlowToRemove : function(component, event) {
        
        let recordId = event.getSource().get("v.name");
        let flowName = component.get("v.ImhotepActiveMetadata.iab__Project_Delete_Project_Member__c");

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