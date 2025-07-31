// *******************************************************************************************
// @Name		    imhotepFlowReleaseSelectionList
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date		    08/01/2024
// @Description	    LWC used in a screen flow as a low-click method for transferring a story to a different release.
// @Used            iab__Imhotep_Story_Transfer flow
// *******************************************************************************************
// COPYRIGHT AND LICENSE
// Copyright (c) 2023, Salesforce, Inc.
// SPDX-License-Identifier: Apache-2
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the
// License. You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS"
// BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language
// governing permissions and limitations under the License.
// *******************************************************************************************

import { LightningElement, api } from 'lwc';
import { FlowNavigationNextEvent } from 'lightning/flowSupport';

// import custom labels
import SelectReleaseLWCActionLabel from "@salesforce/label/c.SelectReleaseLWCActionLabel";
import SelectReleaseLWCFieldLabel from "@salesforce/label/c.SelectReleaseLWCFieldLabel";

export default class ImhotepFlowReleaseSelectionList extends LightningElement {
    
    // set input properties
    @api inputReleaseColl;                  // collection of iab__Release__c records from the flow

    // set output properties
    @api outputButtonClicked = false;       // available to flow to verify that a button has been clicked
    @api outputSelectedReleaseId;           // record Id for the selected release

    // other properties
    showReleaseList = false;                // controls whether to display the release list

    // define custom labels
    label = {
        SelectReleaseLWCActionLabel,
        SelectReleaseLWCFieldLabel,
    }



    // ======================================
    // LIFECYCLE HOOKS
    // ======================================

    connectedCallback(){
        // display list if inputReleaseColl has records
        if(this.inputReleaseColl.length > 0) {
            this.showReleaseList = true;
        }
    }



    // ======================================
    // EVENT HANDLER METHODS
    // ======================================

    // when the Select button is clicked for a release
    handleSelection(event) {

        // store selected values as output properties
        this.outputButtonClicked = true;
        this.outputSelectedReleaseId = event.target.value;

        // navigate to the next screen
        const navigateNextEvent = new FlowNavigationNextEvent();
        this.dispatchEvent(navigateNextEvent);
    }

}