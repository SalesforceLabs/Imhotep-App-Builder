// *******************************************************************************************
// @Name		    imhotepFlowMetadataTypeActionList
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date		    06/30/2024
// @Description	    LWC used in a screen flow as a low-click method for logging changes to Metadata Components for a given story.
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
// 06/30/2024   Mitch Lynch     S000369     Created base component.
// *******************************************************************************************
// NOTES
// Lightning Datatable LWC documentation: https://developer.salesforce.com/docs/component-library/bundle/lightning-datatable/documentation
// *******************************************************************************************

import { LightningElement, api, wire, track } from 'lwc';
import { FlowNavigationNextEvent } from 'lightning/flowSupport';

// import custom labels
import LogChangeLWCActionDeletedLabel from "@salesforce/label/c.LogChangeLWCActionDeletedLabel";
import LogChangeLWCActionModifiedLabel from "@salesforce/label/c.LogChangeLWCActionModifiedLabel";
import LogChangeLWCActionNewLabel from "@salesforce/label/c.LogChangeLWCActionNewLabel";
import LogChangeLWCComponentListEmptyState from "@salesforce/label/c.LogChangeLWCComponentListEmptyState";
import LogChangeLWCInitialState from "@salesforce/label/c.LogChangeLWCInitialState";
import LogChangeLWCListHeader from "@salesforce/label/c.LogChangeLWCListHeader";
import LogChangeLWCListMessage from "@salesforce/label/c.LogChangeLWCListMessage";

// import Apex
import getMetadataTypes from '@salesforce/apex/ImhotepAppBuilderCtrl.getMetadataTypes';
import getMetadataComponents from '@salesforce/apex/ImhotepAppBuilderCtrl.getMetadataComponents';

export default class ImhotepFlowMetadataTypeActionList extends LightningElement {

    // define custom labels
    label = {
        LogChangeLWCActionDeletedLabel,
        LogChangeLWCActionModifiedLabel,
        LogChangeLWCActionNewLabel,
        LogChangeLWCComponentListEmptyState,
        LogChangeLWCInitialState,
        LogChangeLWCListHeader,
        LogChangeLWCListMessage,
    }

    // set input properties
    @api projectId;                             // Id for a iab__Project__c record

    // set output properties
    @api outputButtonClicked = false;           // available to flow to verify that a button has been clicked
    @api outputSelectedChangeType;              // output to store the selected change type
    @api outputSelectedComponent;               // output to store the selected component's recordId (for Modified and Deleted)
    @api outputSelectedMetadataType;            // output to store the selected metadata type

    // prep variables for receiving results of Apex methods
    @track metadataTypes = [];                  // array for holding metadata type picklist values
    @track metadataComponents;                  // collection variable for holding iab__Metadata_Component__c records
    @track filteredMetadataComponents = [];     // filtered collection of iab__Metadata_Component__c records
    metadataComponentCount;                     // number of metadata components in the selected metadata type
    isFirstRender = true;                       // controls whether to display the initial instructions or not
    showComponents = false;                     // controls whether to display the selected iab__Metadata_Component__c records for the selected metadata type



    // wire the getMetadataTypes() method
    // retrieves all iab__Metadata_Type__c picklist values
    @wire(getMetadataTypes)
    wiredMetadataTypes({ error, data }) {
        if (data) {
            this.metadataTypes = data;
        } else if (error) {
            console.error(error);
        }
    }

    

    // wire the getMetadataComponents() method
    // retrieve all iab__Metadata_Component__c records for a specific iab__Project__c
    @wire(getMetadataComponents, {paramProjectId: '$projectId'})
    wiredMetadataComponents({ error, data }) {
        if (data) {
            this.metadataComponents = data;
        } else if (error) {
            console.error(error);
        }
    }



    // event handler when a metadata type is selected
    // handles data prep/filtering, display, and styling
    handleMetadataTypeSelection(event) {
        this.isFirstRender = false;
        this.selectedMetadataType = event.target.dataset.metadatatype;
        
        // filter the metadata components by the selected metadata type
        this.filteredMetadataComponents = [];
        this.metadataComponentCount = 0;
        this.showComponents = false;
        if (this.metadataComponents && this.metadataComponents.length > 0) {
            this.filteredMetadataComponents = this.metadataComponents.filter((component) => {
                const metadataType = component.iab__Metadata_Type__c || '';
                return (
                    this.selectedMetadataType.length === 0 ||
                    metadataType.includes(this.selectedMetadataType)
                );
            });

            this.metadataComponentCount = this.filteredMetadataComponents.length;
            this.showComponents = this.metadataComponentCount > 0;
        } else {
            console.warn('Metadata Components not yet available for filtering.');
        }

        // force reactivity update
        this.filteredMetadataComponents = [...this.filteredMetadataComponents];
        this.showComponents = this.showComponents;

        // change css styling for selected/unselected metadata types
        
        // reset all divs to the unselected class
        const allDivs = this.template.querySelectorAll('.iab-selected-metadata-type');
        allDivs.forEach(div => {
            div.classList.remove('iab-selected');
            div.classList.add('iab-unselected');
        });

        // set the clicked div to the selected class
        event.target.classList.remove('iab-unselected');
        event.target.classList.add('iab-selected');
    }



    // event handler when a New, Modified, or Deleted button is clicked
    // handles data prep and flow navigation to the next screen
    handleChangeTypeSelection(event) {
        // determine which metadata type was selected
        console.log("this.outputSelectedMetadataType: " + this.outputSelectedMetadataType);

        // determine which change type was selected
        this.outputSelectedChangeType = event.target.dataset.changetype;
        console.log("this.outputSelectedChangeType: " + this.outputSelectedChangeType);
        
        // determine which metadata component was clicked on (if any)
        this.outputSelectedComponent = event.target.dataset.component;
        console.log("this.outputSelectedComponent: " + this.outputSelectedComponent);

        this.outputSelectedMetadataType = this.selectedMetadataType;
        this.outputButtonClicked = true;
        
        // navigate to the next screen
        const navigateNextEvent = new FlowNavigationNextEvent();
        this.dispatchEvent(navigateNextEvent);
    }
}