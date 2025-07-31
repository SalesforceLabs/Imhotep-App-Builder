// *******************************************************************************************
// @Name		    imhotepFlowModal
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date		    07/01/2023
// @Description	    LWC displays a modal window that contains a Flow.
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

import { api } from 'lwc';
import LightningModal from 'lightning/modal';

export default class ImhotepFlowModal extends LightningModal {
    @api size;
    @api label;
    @api flowAPIName;
    @api inputVariables;



    // ======================================
    // EVENT HANDLER METHODS
    // ======================================

    handleStatusChange(event) {
        if (event.detail.status === 'FINISHED') {
            // set behavior after a finished flow interview
            this.close('okay');
        }
    }
}