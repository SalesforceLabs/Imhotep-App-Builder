// *******************************************************************************************
// @Name			devTemplateSectionTableTabRow.cmp
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date			03/06/2023
// @Description	    Displays a single template row with expandable/collapsible template item details. Used for each template on the devTemplateSelectionTable component.
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
// 05/25/2024   Mitch Lynch     S000504     Reworked the component to work in the new org.
//
// LEGACY ORG PACKAGE CHANGES:
// 02/24/2024   Mitch Lynch     S000430     Modified to use custom labels, such as {!$Label.c.GeneralModalCloseLabel}.
// 02/21/2024   Mitch Lynch     S000436     Commented out all console.log() methods used for debugging.
// 02/21/2024   Mitch Lynch     S000437     Standardized button and icon attributes for accessibility.
// 03/06/2023	Mitch Lynch		S-000188	Initial component created.
// *******************************************************************************************

({
	
    handleExpandButtonClick : function (component) {
        component.set('v.expanded', !component.get('v.expanded'));
        // console.log("Template expanded/collapsed");
    },

    handleTemplateSelection : function (component,event) {
        var compEvent = component.getEvent("compEventSelect");
        // console.log("Event fired");
        let templateId = event.getSource().get( "v.name" );
        // console.log("Selected template Id is: "+templateId);
        compEvent.setParams({"selectedTemplate" : templateId});
        compEvent.fire();
    }

})