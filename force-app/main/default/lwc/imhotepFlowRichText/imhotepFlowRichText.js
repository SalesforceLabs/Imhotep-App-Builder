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

export default class ImhotepFlowRichText extends LightningElement {

    @api defaultValue;      // input value from Flow
    @api labelText;
    @api tooltipText;
    @api outputValue;       // output of value to Flow
    @api isRequired;        // not used



    // ======================================
    // LIFECYCLE HOOKS
    // ======================================

    connectedCallback() {

        this.outputValue = this.defaultValue;
    }



    // ======================================
    // EVENT HANDLER METHODS
    // ======================================

    handleChange(event) {
        this.outputValue = event.target.value;
    }

}