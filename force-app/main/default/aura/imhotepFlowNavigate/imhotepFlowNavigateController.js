// *******************************************************************************************
// @Name			imhotepFlowNavigate.cmp (fka devFlowNavigate)
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date			02/29/2024
// @Description	    Component used in flow to navigate the user to a record page.
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
// *******************************************************************************************/

({
    invoke : function(component, event, helper) {
        // Get the record ID attribute
        var record = component.get("v.recordId");
        
        // Get the Lightning event that opens a record in a new tab
        var redirect = $A.get("e.force:navigateToSObject");
        
        // Pass the record ID to the event
        redirect.setParams({"recordId": record});
            
        // Open the record
        redirect.fire();
    }
})