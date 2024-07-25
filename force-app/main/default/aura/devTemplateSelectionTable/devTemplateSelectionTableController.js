// *******************************************************************************************
// @Name			devTemplateSelectionTable.cmp (fka devThemeStories.cmp)
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date			03/04/2023
// @Description	    Displays tabbed tables of templates for selection.
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
// 05/25/2024   Mitch Lynch     S000503     Reworked the component to work in the new org.
//
// LEGACY ORG PACKAGE CHANGES:
// 02/24/2024   Mitch Lynch     S000430     Modified to use custom labels, such as {!$Label.c.GeneralModalCloseLabel}.
// 02/21/2024   Mitch Lynch     S000436     Commented out all console.log() methods used for debugging.
// 02/21/2024   Mitch Lynch     S000437     Standardized button and icon attributes for accessibility.
// 03/06/2023   Mitch Lynch     S-000188    Continued development.
// 03/04/2023	Mitch Lynch		S-000188    Created base component.
// *******************************************************************************************
// NOTES
// This component, including any referenced resources including but not limited to components, Apex controllers, objects, fields, and static resources, was developed by Mitch Lynch for Salesforce.com.  Use only with permission.
// *******************************************************************************************

({
	doInit : function(component, event, helper) {
        
        // Get all Projects as a list of lists
        var actionAllTemplates = component.get("c.getTemplatesByType");
        actionAllTemplates.setCallback(this, function(response) {
            // console.log('We have a callback for actionAllTemplates!');
            // console.log('Response Vals: [' + response.getReturnValue() + ']');
            
            var state = response.getState();
            if(component.isValid && state === "SUCCESS") {
                var responseValue = response.getReturnValue();
                
                // Get all My Templates
                component.set("v.MyTemplateRecords", responseValue[0]);
                
                // Get all Standard Templates
                component.set("v.StandardTemplateRecords", responseValue[1]);
                
                // Get all Shared Templates
                component.set("v.SharedTemplateRecords", responseValue[2]);
            }
        });
        // console.log("Call Apex actionAllTemplates - get all templates");
        $A.enqueueAction(actionAllTemplates);
        
        
        // Get Template Item (Mine) records
        var action2 = component.get("c.getTemplateItemsForType");
        action2.setParams({
            ParamTemplateType : 'Mine'
        })
        action2.setCallback(this, function(data) {
            component.set("v.MyTemplateItemRecords", data.getReturnValue());
            // console.log(data.getReturnValue());
        });
        // console.log("Call Apex action2 - get my template items");
        $A.enqueueAction(action2);
        
        
        // Get Template Item (Standard) records
        var action3 = component.get("c.getTemplateItemsForType");
        action3.setParams({
            ParamTemplateType : 'Standard'
        })
        action3.setCallback(this, function(data) {
            component.set("v.StandardTemplateItemRecords", data.getReturnValue());
            // console.log(data.getReturnValue());
        });
        // console.log("Call Apex action3 - get standard template items");
        $A.enqueueAction(action3);
        
        
        // Get Template Item (Shared) records
        var action4 = component.get("c.getTemplateItemsForType");
        action4.setParams({
            ParamTemplateType : 'Shared'
        })
        action4.setCallback(this, function(data) {
            component.set("v.SharedTemplateItemRecords", data.getReturnValue());
            // console.log(data.getReturnValue());
        });
        // console.log("Call Apex action4 - get shared template items");
        $A.enqueueAction(action4);

    },

    handleTemplateSelection : function(component,event) {
        var templateid = event.getParam("selectedTemplate");

        // set the handler attributes based on event data
        component.set("v.SelectedTemplateId", templateid);
        
        // mark that button has been clicked
        component.set("v.buttonClicked", true);
        
        // navigate in the flow
        var navigate = component.get("v.navigateFlow");
        navigate("NEXT");
    }

})