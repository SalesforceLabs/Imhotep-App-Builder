// *******************************************************************************************
// @Name			devProjectTileTab.cmp
// @Author		Mitch Lynch (mitch.lynch@salesforce.com)
// @Date			09/28/2022
// @Description	Displays project cards with releases for a given project status. Used for each tab on the devProjectTiles component.
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
// 06/23/2024   Mitch Lynch     S000379     Made the New Project button display for all Project Status values.
// 06/21/2024   Mitch Lynch     S000368     Replaced SLDS empty state image with custom image (ImhotepIllustrationEmptyState02).
// 05/25/2024   Mitch Lynch     S000516     Reworked the component to work in the new org.
//
// LEGACY ORG PACKAGE CHANGES:
// 02/24/2024   Mitch Lynch     S000430     Modified to use custom labels, such as {!$Label.c.GeneralModalCloseLabel}.
// 02/20/2024   Mitch Lynch     S000437     Standardized button and icon attributes for accessibility.
// 08/25/2023   Mitch Lynch     S-000342    Now only rendering release cards and New Release buttons if TabName is not "Completed".
// 06/25/2023   Mitch Lynch     S-000330    Updated empty state to have a different message for the Completed tab, which will also no longer feature a New Project button.
// 06/24/2023   Mitch Lynch     S-000330    Added an empty state for releases based on the SLDS Illustration blueprint.
// 06/21/2023   Mitch Lynch     S-000330    Updated the empty state to reflect the SLDS Illustration blueprint. Added attributes to receive the name of the new project flow and the tab from the devProjectTiles component to help display an appropriate empty state.
// 03/07/2023   Mitch Lynch     S-000188    Added support for the "New Release From Template" button.
// 02/25/2023   Mitch Lynch     S-000183    Replace controller ImhotepProjectsCtrl with ImhotepAppBuilderCtrl.
// 02/24/2023   Mitch Lynch     S-000180    Renamed controller from devProjectsCtrl to ImhotepProjectsCtrl.
// 02/21/2023   Mitch Lynch     S-000166    Updated to use namespace "imhotep".
// 10/22/2022   Mitch Lynch     000070      Renamed devProjectTileTab (was devProjectTileTabContent). Updated to use the new devReleaseTile component to maximize reuse of tile markup and to implement lightning:navigation.
// 10/21/2022   Mitch Lynch		S-000096	Implemented lightning:formattedUrl for URLs so that records open in the console without refreshing the browser (faster).
// 09/28/2022	Mitch Lynch		000070		Created base component. Using SLDS Grid system classes on release cards/layoutitems to be responsive for tablets and mobile.
// *******************************************************************************************
// NOTES
// This component, including any referenced resources including but not limited to components, Apex controllers, objects, fields, and static resources, was developed by Mitch Lynch for Salesforce.com.  Use only with permission.
//
// Responsive layoutitem classes with the SLDS Grid System: https://www.lightningdesignsystem.com/utilities/grid/#MobileTabletDesktop-Example
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