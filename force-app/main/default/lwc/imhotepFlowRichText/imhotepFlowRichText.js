// *******************************************************************************************
// @Name		    imhotepFlowRichText (fka simpleRichTextInput)
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date		    11/02/2022
// @Description	    LWC displays a rich text input field for use in a Flow screen.
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
// 05/25/2024   Mitch Lynch     S000495     Reworked the LWC to work in the new org.  Renamed imhotepFlowRichText (fka simpleRichTextInput).
//
// LEGACY ORG PACKAGE CHANGES:
// 02/22/2024   Mitch Lynch     S000441     Added the setting of the outputValue property with an initial value from defaultValue in the connectedCallback() (S-000417 over-corrected for sessionStorage and removed this vital default value setting).
// 01/14/2024   Mitch Lynch     S-000417    Resolved the Client DOM Stored XSS issue identified by Checkmarx by removing use of session storage.
// 08/26/2023   Mitch Lynch     S-000372    Added padding to the bottom of the component.
// 06/07/2023   Mitch Lynch     S-000322    Resolved (I think) issues using sessionStorage that were storing/carrying values into multiple instances of the component.
// 06/05/2023   Mitch Lynch     S-000320    Modified to define the formats attribute, since it does not include a text color control by default.
// 01/11/2023   Mitch Lynch		S-000322    Created base component.
// *******************************************************************************************
// NOTES
// 
// - Based on Lightning Input Rich Text base component:       https://developer.salesforce.com/docs/component-library/bundle/lightning-input-rich-text/documentation
// 
// - Looked at this LWC for some troubleshooting:             https://github.com/alexed1/LightningFlowComponents/blob/master/flow_screen_components/richTextInputFSC/force-app/main/default/lwc/inputRichTextFSC/inputRichTextFSC.js
// 
// *******************************************************************************************

import { LightningElement, api } from 'lwc';

export default class ImhotepFlowRichText extends LightningElement {

    @api defaultValue;      // input value from Flow
    @api labelText;
    @api tooltipText;
    @api outputValue;       // output of value to Flow
    @api isRequired;        // not used

    // myVal;
    // @track inputValue = this.defaultValue;

    

    connectedCallback() {

        this.outputValue = this.defaultValue;

        /*
        this.inputValue = this.defaultValue;

        if(sessionStorage.getItem('richValue')){
            // this.myVal = sessionStorage.getItem('richValue');
            this.inputValue = sanitize(sessionStorage.getItem('richValue'));
            this.outputValue = sanitize(sessionStorage.getItem('richValue'));
    
            // reset sessionStorage value
            sessionStorage.removeItem('richValue');
        }
        else {
            // this.myVal = this.defaultValue;
            this.inputValue = this.defaultValue;
            this.outputValue = this.defaultValue;
        }
        */
    }

    

    handleChange(event) {
        // this.myVal = event.target.value;
        this.outputValue = event.target.value;

        // set sessionStorage value
        // sessionStorage.setItem('richValue',this.outputValue);
    }

}