// *******************************************************************************************
// @Name			devProjectTags.cmp
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date            10/13/2022
// @Description     Displays related Tags on a Project record.
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


        // Get Tag records for a iab__Project__c
        var action = component.get("c.getActiveProjectTagRecords");
        action.setParams({
            ParamProjectId : component.get("v.recordId")
        })
        action.setCallback(this, function(data) {
            component.set("v.ActiveProjectTagRecords", data.getReturnValue());
            // console.log(data.getReturnValue());
        });
        // console.log("Call Apex action - get active tag assignments");
        $A.enqueueAction(action);
        
    },
    
    
    
    // runs a designated flow to delete a specific Tag
    deleteTagAssignment : function(component, event) {
        
        // get the recordId for the current Tag record
        var recordId = event.getSource().get("v.value");

        // get flow's API name
        let flowName = event.getSource().get("v.name");
        
        // console.log('recordId = ' + recordId);
        // console.log('flowName = ' + flowName);

        component.set("v.showModal", true);

        $A.createComponent(
            "lightning:flow",{"onstatuschange": component.getReference("c.hideModal")},
            (flow, status, errorMessage) => {
                if (status === "SUCCESS") {
                    component.set("v.body", flow);
                    component.set("v.flow", flow);
                    var inputVariables = [{name : "recordId", type : "String", value: recordId}];

                	flow.startFlow(flowName, inputVariables);
                }
            }
        );
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
                if (status === "SUCCESS") {
                    component.set("v.body", flow);
                    component.set("v.flow", flow);
                	flow.startFlow(flowName);
                }
            }
        );
        
    },
    
    
    
    // runs a designated flow and provide recordId as an input variable
    runFlowRecordSensitive : function(component, event) {
        
        // get the recordId for the current record (if any)
        var recordId = component.get("v.recordId");
        
        let flowName = event.getSource().get("v.name");

        component.set("v.showModal", true);

        $A.createComponent(
            "lightning:flow",
            {
                "onstatuschange": component.getReference("c.hideModal")
            },
            (flow, status, errorMessage) => {
                if (status === "SUCCESS") {
                    component.set("v.body", flow);
                    component.set("v.flow", flow);
                	var inputVariables = [{name : "recordId", type : "String", value: recordId}];
            		
            		flow.startFlow(flowName, inputVariables);
                }
            }
        );

    },
    
    
	
    // hides flow modal
    hideModal : function(component, event) {
        
        if (event.getParam("status").indexOf("FINISHED") !== -1) {
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