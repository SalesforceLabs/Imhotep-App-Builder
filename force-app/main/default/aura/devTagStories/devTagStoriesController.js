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