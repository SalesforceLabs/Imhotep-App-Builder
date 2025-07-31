// *******************************************************************************************
// @Name		    imhotepAppCard
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date		    03/24/2023
// @Description	    LWC displays a welcome card on the Imhotep App Builder home page.
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

import { LightningElement, wire } from 'lwc';

// Import Apex
import getImhotepActiveMetadata from '@salesforce/apex/ImhotepAppBuilderCtrl.getImhotepActiveMetadata';

// Import custom labels
import ImageImhotepLogoAlt from "@salesforce/label/c.ImageImhotepLogoAlt";
import AppCardWelcomeContent1 from "@salesforce/label/c.AppCardWelcomeContent1";
import AppCardWelcomeContent2 from "@salesforce/label/c.AppCardWelcomeContent2";
import AppCardWelcomeContent3 from "@salesforce/label/c.AppCardWelcomeContent3";
import AppCardDocumentationLinkText from "@salesforce/label/c.AppCardDocumentationLinkText";
import AppCardCurrentReleaseText from "@salesforce/label/c.AppCardCurrentReleaseText";
import AppCardAccordionImhotepLabel from "@salesforce/label/c.AppCardAccordionImhotepLabel";
import AppCardAccordionImhotepContent1 from "@salesforce/label/c.AppCardAccordionImhotepContent1";
import ImageStepPyramidAlt from "@salesforce/label/c.ImageStepPyramidAlt";
import AppCardAccordionImhotepContent2 from "@salesforce/label/c.AppCardAccordionImhotepContent2";
import AppCardAccordionImhotepContent3 from "@salesforce/label/c.AppCardAccordionImhotepContent3";

// Import static resources
import IMHOTEP_LOGO_IMAGE from '@salesforce/resourceUrl/ImhotepAppLogo';
import IMHOTEP_PYRAMID_IMAGE from '@salesforce/resourceUrl/ImhotepStepPyramid';

export default class ImhotepAppCard extends LightningElement {

    // prep variables for receiving the active custom metadata record
    activeMetadata;

    // define custom labels
    label = {
        ImageImhotepLogoAlt,
        AppCardWelcomeContent1,
        AppCardWelcomeContent2,
        AppCardWelcomeContent3,
        AppCardDocumentationLinkText,
        AppCardCurrentReleaseText,
        AppCardAccordionImhotepLabel,
        AppCardAccordionImhotepContent1,
        ImageStepPyramidAlt,
        AppCardAccordionImhotepContent2,
        AppCardAccordionImhotepContent3,
    };

    // define static resources
    imhotepLogoUrl = IMHOTEP_LOGO_IMAGE;
    imhotepStepPyramid = IMHOTEP_PYRAMID_IMAGE;



    // ======================================
    // WIRE ADAPTER METHODS
    // ======================================
    
    @wire(getImhotepActiveMetadata)
        wiredActiveMetadata({ error, data }) {
            if (data) {
                this.activeMetadata = data;
            } else if (error) {
                console.error('Error retrieving active custom metadata settings: ', error);
            }
        }

    // handle accordion settings
    activeSections = [];
    activeSectionsMessage = '';



    // ======================================
    // EVENT HANDLER METHODS
    // ======================================

    handleSectionToggle(event) {
        const openSections = event.detail.openSections;

        if (openSections.length === 0) {
            this.activeSectionsMessage = 'All sections are closed';
        } else {
            this.activeSectionsMessage =
                'Open sections: ' + openSections.join(', ');
        }
    }
}