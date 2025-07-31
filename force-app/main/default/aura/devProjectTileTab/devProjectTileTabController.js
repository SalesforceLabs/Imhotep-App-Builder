// *******************************************************************************************
// @Name			devProjectTileTab.cmp
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date			09/28/2022
// @Description	    DEPRECATED, use imhotepMyProjects LWC instead. Displays project cards with releases for a given project status. Used for each tab on the devProjectTiles component.
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
    // runs the designated flow for creating a New Project
    runNewProjectFlow : function(component, event) {
        
        let flowName = component.get("v.NewProjectFlow");

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


    
    // runs the designated flow for creating a New Release
    // property default: iab__Imhotep_Release_NewRelease
    runNewReleaseFlow : function(component, event) {
        
        var projectId = event.getSource().get("v.name");
        let flowName = component.get("v.NewReleaseFlow");

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
                	var inputVariables = [{name : "recordId", type : "String", value: projectId}];
            		
            		flow.startFlow(flowName, inputVariables);
                }
            }
        );
    },



    // runs the designated flow for creating a New Release from a Template
    // property default: iab__Imhotep_Project_CreateReleaseFromTemplate
    runNewReleaseFromTemplateFlow : function(component, event) {
        
        var projectId = event.getSource().get("v.name");
        let flowName = component.get("v.NewReleaseFromTemplateFlow");

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
                	var inputVariables = [{name : "recordId", type : "String", value: projectId}];
            		
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