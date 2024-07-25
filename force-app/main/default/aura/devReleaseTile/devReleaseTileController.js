// *******************************************************************************************
// @Name			devReleaseTile.cmp
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date			10/23/2022
// @Description	    Displays a single Release tile. Used by the devProjectTileTab and devProjectReleases components.
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
// 05/25/2024   Mitch Lynch     S000517     Reworked the component to work in the new org.
//
// LEGACY ORG PACKAGE CHANGES:
// 02/24/2024   Mitch Lynch     S000430     Modified to use custom labels, such as {!$Label.c.GeneralModalCloseLabel}.
// 02/21/2024   Mitch Lynch     S000437     Standardized button and icon attributes for accessibility.
// 02/25/2023   Mitch Lynch     S-000183    Replace controller ImhotepProjectsCtrl with ImhotepAppBuilderCtrl.
// 02/24/2023   Mitch Lynch     S-000180    Renamed controller from devProjectsCtrl to ImhotepProjectsCtrl.
// 02/21/2023   Mitch Lynch     S-000166    Updated to use namespace "imhotep".
// 10/23/2022	Mitch Lynch		S-000096    Created base component; migrated to a child component to maximize reusability and implement lightning:navigation.
// *******************************************************************************************
// NOTES
// This component, including any referenced resources including but not limited to components, Apex controllers, objects, fields, and static resources, was developed by Mitch Lynch for Salesforce.com.  Use only with permission.
//
// Responsive layoutitem classes with the SLDS Grid System: https://www.lightningdesignsystem.com/utilities/grid/#MobileTabletDesktop-Example
// *******************************************************************************************

({
    doInit : function(component, event, helper) {
        // var releaseId = component.get("v.ReleaseRecord.Id");

        var navService = component.find("navService");
        // Sets the route to /lightning/r/iab__Release__c/recordId/view
        var pageReference = {
            type: 'standard__recordPage',
            attributes: {
                objectApiName: 'iab__Release__c',
                recordId: component.get("v.ReleaseRecord.Id"),
                actionName: 'view'
            }
        };
        component.set("v.pageReference", pageReference);
        // Set the URL on the link or use the default if there's an error
        var defaultUrl = "#";
        navService.generateUrl(pageReference)
            .then($A.getCallback(function(url) {
                component.set("v.url", url ? url : defaultUrl);
            }), $A.getCallback(function(error) {
                component.set("v.url", defaultUrl);
            }));
    },
    
    
    
    // open Release record that was clicked on
    openRelease : function(component, event) {
        var navService = component.find("navService");
        // Uses the pageReference definition in the init handler
        var pageReference = component.get("v.pageReference");
        event.preventDefault();
        navService.navigate(pageReference);
    }
})