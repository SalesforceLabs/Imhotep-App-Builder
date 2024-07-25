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
// 06/02/2024   Mitch Lynch     S000033     Updated link to documentation from a static URL to use a dynamic value in Imhotep_Config called Documentation_URL__c.
// 05/25/2024   Mitch Lynch     S000491     Reworked the LWC to work in the new org.
//                                          Removed references to unused static resource (ImhotepPyramidLogo).
//
// LEGACY ORG PACKAGE CHANGES:
// 02/25/2024   Mitch Lynch     S000430     Modified to use custom labels.
// 06/30/2023   Mitch Lynch     S-000329    Updated to retrieve active custom metadata with getImhotepActiveMetadata(), display Current Release Version and Date, and display a link button to documentation.
// 06/27/2023   Mitch Lynch     S-000327    Added form factors for target configs to ensure visibility from the Salesforce mobile app.
// 03/25/2023   Mitch Lynch     S-000198    Added accordion sections and updated the logo to use the cartouche version.
// 03/24/2023	Mitch Lynch     S-000198	Created base component.
// *******************************************************************************************
// NOTES
// Uses 3 static resources:  ImhotepAppLogo and ImhotepStepPyramid.
// *******************************************************************************************

import { LightningElement, wire } from 'lwc';

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

// Import Apex
import getImhotepActiveMetadata from '@salesforce/apex/ImhotepAppBuilderCtrl.getImhotepActiveMetadata';

export default class ImhotepAppCard extends LightningElement {

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

    // prep variables for receiving the active custom metadata record
    activeMetadata;

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