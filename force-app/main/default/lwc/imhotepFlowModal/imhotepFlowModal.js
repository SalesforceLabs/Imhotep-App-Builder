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
// 05/24/2024   Mitch Lynch     S000490     Reworked the LWC to work in the new org.
//
// LEGACY ORG PACKAGE CHANGES:
// 06/01/2023	Mitch Lynch     S-000335	Created base component.
// *******************************************************************************************
// NOTES
// n/a
// *******************************************************************************************

import { api } from 'lwc';
import LightningModal from 'lightning/modal';


export default class ImhotepFlowModal extends LightningModal {
    @api size;
    @api label;
    @api flowAPIName;
    @api inputVariables;

    handleStatusChange(event) {
        if (event.detail.status === 'FINISHED') {
            // set behavior after a finished flow interview
            this.close('okay');
        }
    }
}