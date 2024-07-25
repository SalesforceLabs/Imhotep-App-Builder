// *******************************************************************************************
// @Name			devTagStories.cmp (fka devThemeStories.cmp)
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date			04/15/2022
// @Description     Displays tabbed tables of stories for a given Tag.
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
// 05/26/2024   Mitch Lynch     S000517     Reworked the component to work in the new org.
//
// LEGACY ORG PACKAGE CHANGES:
// 02/24/2024   Mitch Lynch     S000430     Modified to use custom labels, such as {!$Label.c.GeneralModalCloseLabel}.
// 02/21/2024   Mitch Lynch     S000436     Commented out all console.log() methods used for debugging.
// 02/21/2024   Mitch Lynch     S000437     Standardized button and icon attributes for accessibility.
// 03/02/2023   Mitch Lynch     S-000193    Fixed error in var reference for BacklogReleaseRecords.
// 02/24/2023   Mitch Lynch     S-000180    Renamed controller from devImhotepAppBuilderCtrl to ImhotepAppBuilderCtrl.
// 02/24/2023   Mitch Lynch     000079      Updated imhotep__Assigned__c to use imhotep__Assigned_Project_Member__c.
// 02/21/2023   Mitch Lynch     S-000166    Updated to use namespace "imhotep".
// 10/29/2022   Mitch Lynch     S-000103    Updated controller to devImhotepAppBuilderCtrl (retiring devTagStoriesCtrl).
// 10/21/2022	Mitch Lynch		S-000096	Implemented lightning:formattedUrl for URLs so that records open in the console without refreshing the browser (faster).
// 10/13/2022	Mitch Lynch		000080		Updated to work with renamed objects Dev_Theme__c (now Tag__c) and Dev_Theme_Assignment__c (Tag_Assignment__c).
// 04/19/2022	Mitch Lynch		unknown		Continued work on initial component version.
// 04/15/2022	Mitch Lynch		unknown		Created base component.
// *******************************************************************************************
// NOTES
// This component, including any referenced resources including but not limited to components, Apex controllers, objects, fields, and static resources, was developed by Mitch Lynch for Salesforce.com.  Use only with permission.
// *******************************************************************************************

({
	doInit : function(component) {
        
        // Get Tag Assignments
        // where iab__Release_Category__c == Active Release
        var action1 = component.get("c.getTagAssignmentRecords");
        action1.setParams({
            ParamTagId : component.get("v.recordId"),
            ParamReleaseFilter : 'Active Release'
        })
        action1.setCallback(this, function(data) {
            component.set("v.ActiveReleaseRecords", data.getReturnValue());
            // console.log(data.getReturnValue());
        });
        // console.log("Call Apex action1 - get active release tag assignments");
        $A.enqueueAction(action1);
        
        
        // Get Tag Assignments
        // where iab__Release_Category__c == Planning Release
        var action2 = component.get("c.getTagAssignmentRecords");
        action2.setParams({
            ParamTagId : component.get("v.recordId"),
            ParamReleaseFilter : 'Planning Release'
        })
        action2.setCallback(this, function(data) {
            component.set("v.PlanningReleaseRecords", data.getReturnValue());
            // console.log(data.getReturnValue());
        });
        // console.log("Call Apex action2 - get planning release tag assignments");
        $A.enqueueAction(action2);
        
        
        // Get Tag Assignments
        // where iab__Release_Category__c == Backlog
        var action3 = component.get("c.getTagAssignmentRecords");
        action3.setParams({
            ParamTagId : component.get("v.recordId"),
            ParamReleaseFilter : 'Backlog'
        })
        action3.setCallback(this, function(data) {
            component.set("v.BacklogReleaseRecords", data.getReturnValue());
            // console.log(data.getReturnValue());
        });
        // console.log("Call Apex action3 - get backlog tag assignments");
        $A.enqueueAction(action3);
        
        
        // Get Tag Assignments
        // where iab__Release_Category__c == Accepted Release
        var action4 = component.get("c.getTagAssignmentRecords");
        action4.setParams({
            ParamTagId : component.get("v.recordId"),
            ParamReleaseFilter : 'Accepted Release'
        })
        action4.setCallback(this, function(data) {
            component.set("v.AcceptedReleaseRecords", data.getReturnValue());
            // console.log(data.getReturnValue());
        });
        // console.log("Call Apex action4 - get accepted release tag assignments");
        $A.enqueueAction(action4);
        
        
        // Get Tag Assignments (all)
        var action5 = component.get("c.getTagAssignmentRecords");
        action5.setParams({
            ParamTagId : component.get("v.recordId"),
            ParamReleaseFilter : 'All'
        })
        action5.setCallback(this, function(data) {
            component.set("v.AllReleaseRecords", data.getReturnValue());
            // console.log(data.getReturnValue());
        });
        // console.log("Call Apex action5 - get all release tag assignments");
        $A.enqueueAction(action5);
        
    }
})