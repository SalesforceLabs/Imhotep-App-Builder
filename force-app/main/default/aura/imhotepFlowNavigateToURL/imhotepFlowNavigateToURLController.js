// *******************************************************************************************
// @Name			imhotepFlowNavigateToURL.cmp (fka devFlowNavigate)
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date			02/29/2024
// @Description	    Component used in flow to navigate the user to a URL.
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
// 06/30/2024   Mitch Lynch     S000497     Cloned imhotepFlowNavigate and modified to use force:navigateToURL (instead of force:navigateToSObject).
// *******************************************************************************************/
// NOTES
// current this component only supports navigating to a Story; for other objects, use imhotepFlowNavigate.
//
// Navigate to URL: https://developer.salesforce.com/docs/component-library/bundle/force:navigateToURL/documentation
// Redirect Flow Users with a Local Action: https://help.salesforce.com/s/articleView?id=sf.flow_concepts_finish_override.htm&type=5
// *******************************************************************************************/

({
    invoke : function(component) {
        // get the target object
        var targetobject = component.get("v.targetObject");

        // Get the record ID attribute
        var record = component.get("v.recordId");

        if(targetobject == 'Story') {
            // get the Project Id
            var project = component.get("v.projectId");

            // form the url
            // example: /lightning/r/iab__Story__c/a02ak000001itWTAAY/view?ws=%2Flightning%2Fr%2Fiab__Project__c%2Fa00ak00000AhoqDAAR%2Fview
            var url = '/lightning/r/iab__Story__c/' + record + '/view?ws=%2Flightning%2Fr%2Fiab__Project__c%2F' + project + '%2Fview';

            // get the Lightning event that opens a URL
            var redirect = $A.get("e.force:navigateToURL");

            // Pass the record ID to the event
            redirect.setParams({"url": url});
                
            // Open the record
            redirect.fire();
        }
    }
})