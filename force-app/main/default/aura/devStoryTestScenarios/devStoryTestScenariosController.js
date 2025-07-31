// *******************************************************************************************
// @Name			devStoryTestScenarios.cmp (fka devStoryTestCases)
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date			10/26/2022
// @Description	    Displays list of Test Scenarios for a Story.
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


        // Get all Test Scenarios with their Test Results
		var action = component.get("c.getTestScenariosWithTestResults");
        action.setParams({
            ParamStoryId : component.get("v.recordId")
        })
        action.setCallback(this, function(response) {
            var state = response.getState();
            if(component.isValid && state === "SUCCESS") {
                var responseValue = response.getReturnValue();
                component.set("v.TestScenarioRecords", responseValue);
            }
        });
        $A.enqueueAction(action);
    },
    
    
    
    // runs a designated flow to create a new iab__Release__c record
    runFlowToAdd : function(component, event) {
        
        // get Story record Id
        let recordId = component.get("v.recordId");

        // set the name of the flow to use
        let flowName = component.get("v.ImhotepActiveMetadata.iab__Story_New_Test_Scenario__c");

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



    // handles action for selected menu item for a specific Test Scenario
    handleTestScenarioMenuSelect: function(component,event) {
        
        // get Test Scenario record Id
        var selectedTestScenarioId = event.getSource().get("v.name");
        
        // get selected menu action
        // values include:  EditTestScenario, NewTestResults, StatusNotReady, StatusReady, StatusCompleted
        var selectedMenuAction = event.getParam("value");
        
        // set the name of the flow to use
        var flowName = component.get("v.ImhotepActiveMetadata.iab__Story_Test_Scenario_Menu_Actions__c");

        component.set("v.showModal",true);
            
        $A.createComponent("lightning:flow",
            {"onstatuschange": component.getReference("c.hideModal")},
            (flow, status, errorMessage ) => {
                if(status === "SUCCESS") {
                    component.set("v.body",flow);
                    component.set("v.flow",flow);
                    
                    // pass recordId to the flow as an input variable
                    var inputVariables = [
                        {name:"recordId",type:"String",value:selectedTestScenarioId},
                        {name:"inputSelectedAction",type:"String",value:selectedMenuAction}
                    ];
                    
                    flow.startFlow(flowName,inputVariables);
                }
            }
        );
    },
    
    
    
    // runs a designated flow to create a new iab__Test_Result__c record for the given iab__Test_Scenario__c
    // based on handleTestScenarioMenuSelect()
    runFlowToReportTestResults : function(component, event) {
        
        // get Test Scenario record Id
        var selectedTestScenarioId = event.getSource().get("v.name");
        
        // set selected menu action
        var selectedMenuAction = "NewTestResults";
        
        // set the name of the flow to use
        var flowName = component.get("v.ImhotepActiveMetadata.iab__Story_Test_Scenario_Menu_Actions__c");
        
        component.set("v.showModal",true);
            
        $A.createComponent("lightning:flow",
            {"onstatuschange": component.getReference("c.hideModal")},
            (flow, status, errorMessage ) => {
                if(status === "SUCCESS") {
                    component.set("v.body",flow);
                    component.set("v.flow",flow);
                    
                    // pass recordId to the flow as an input variable
                    var inputVariables = [
                        {name:"recordId",type:"String",value:selectedTestScenarioId},
                        {name:"inputSelectedAction",type:"String",value:selectedMenuAction}
                    ];
                    
                    flow.startFlow(flowName,inputVariables);
                }
            }
        );
    },



    // handles the edit button for a specific Test Result
    handleTestResultEdit: function(component,event) {
        
        // set selectedMenuAction
        var selectedMenuAction = "EditTestResult";

        // get Test Result record Id
        var selectedTestResultId = event.getSource().get("v.name");
        
        // set the name of the flow to use
        var flowName = component.get("v.ImhotepActiveMetadata.iab__Story_Test_Result_Menu_Actions__c");
        
        component.set("v.showModal",true);
            
        $A.createComponent("lightning:flow",
            {"onstatuschange": component.getReference("c.hideModal")},
            (flow, status, errorMessage ) => {
                if(status === "SUCCESS") {
                    component.set("v.body",flow);
                    component.set("v.flow",flow);
                    
                    // pass recordId to the flow as an input variable
                    var inputVariables = [
                        {name:"recordId",type:"String",value:selectedTestResultId},
                        {name:"inputSelectedAction",type:"String",value:selectedMenuAction}
                    ];
                    
                    flow.startFlow(flowName,inputVariables);
                }
            }
        );
    },



    // handles the delete button for a specific Test Result
    handleTestResultDelete: function(component,event) {
        
        // set selectedMenuAction
        var selectedMenuAction = "DeleteTestResult";

        // get Test Result record Id
        var selectedTestResultId = event.getSource().get("v.name");
        
        // set the name of the flow to use
        var flowName = component.get("v.ImhotepActiveMetadata.iab__Story_Test_Result_Menu_Actions__c");
        
        component.set("v.showModal",true);
            
        $A.createComponent("lightning:flow",
            {"onstatuschange": component.getReference("c.hideModal")},
            (flow, status, errorMessage ) => {
                if(status === "SUCCESS") {
                    component.set("v.body",flow);
                    component.set("v.flow",flow);
                    
                    // pass recordId to the flow as an input variable
                    var inputVariables = [
                        {name:"recordId",type:"String",value:selectedTestResultId},
                        {name:"inputSelectedAction",type:"String",value:selectedMenuAction}
                    ];
                    
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