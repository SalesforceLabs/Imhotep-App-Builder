// *******************************************************************************************
// @Name		    imhotepResourceBar (fka imhotepProjectResourcesBar)
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date		    06/01/2023
// @Description	    LWC displays a navigable, horizontal list of Project Resource records for the Project, Release, and Story record page.
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

import { LightningElement, api, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';

// import Apex
import getImhotepActiveMetadata from '@salesforce/apex/ImhotepAppBuilderCtrl.getImhotepActiveMetadata';
import getResourceLinks from '@salesforce/apex/ImhotepAppBuilderCtrl.getResourceLinks';
import getProjectId from '@salesforce/apex/ImhotepAppBuilderCtrl.getProjectId';
import ImhotepFlowModal from 'c/imhotepFlowModal';

// import custom labels
import CompResourceBarHeading from "@salesforce/label/c.CompResourceBarHeading";
import ActionNewResourceLinkLabel from "@salesforce/label/c.ActionNewResourceLinkLabel";
import ActionNewResourceLinkAlt from "@salesforce/label/c.ActionNewResourceLinkAlt";
import ActionViewResourceLink from "@salesforce/label/c.ActionViewResourceLink";
import ActionResourceLinkMenuExpandCollapseAlt from "@salesforce/label/c.ActionResourceLinkMenuExpandCollapseAlt";
import ActionEditResourceLinkLabel1 from "@salesforce/label/c.ActionEditResourceLinkLabel1";
import ActionEditResourceLinkLabel2 from "@salesforce/label/c.ActionEditResourceLinkLabel2";
import ActionDeleteResourceLinkLabel from "@salesforce/label/c.ActionDeleteResourceLinkLabel";

export default class ImhotepResourceBar extends LightningElement {

    // set incoming variables
    @api recordId;

    // prep variables for receiving results of Apex methods
    activeMetadata;
    projectId;
    wiredResources;
    projectresources;

    selectedAction;
    selectedResource;

    // define custom labels
    label = {
        CompResourceBarHeading,
        ActionNewResourceLinkLabel,
        ActionNewResourceLinkAlt,
        ActionViewResourceLink,
        ActionResourceLinkMenuExpandCollapseAlt,
        ActionEditResourceLinkLabel1,
        ActionEditResourceLinkLabel2,
        ActionDeleteResourceLinkLabel,
    }
    


    // ======================================
    // WIRE ADAPTER METHODS
    // ======================================

    // wire the getImhotepActiveMetadata() method
    @wire(getImhotepActiveMetadata)
    wiredActiveMetadata({ error, data }) {
        if (data) {
            this.activeMetadata = data
        } else if (error) {
            console.error('Error retrieving active metadata: ', error);
        }
    }
    
    // wire the getProjectId() method
    @wire(getProjectId, {
        paramRecordId: '$recordId'
    })
    wiredProjectId({ error, data }) {
        if (data) {
            this.projectId = data;
        } else if (error) {
            console.error('Error retrieving Project Id: ', error);
        }
    }
    
    // wire the getResourceLinks() method
    @wire(getResourceLinks, {
        paramRecordId: '$recordId'
    })
    // rewired so the provisioned value could be refreshed by refreshApex later when flows close.
    wiredProjectResources(value) {
        // Hold on to the provisioned value so we can refresh it later.
        this.wiredResources = value; // track the provisioned value
        const { data, error } = value; // destructure the provisioned value
        if (data) {
            this.projectresources = data;
        }
        else if (error) {
            console.error('Error retrieving Project Resources: ', error);
        }
    }
    
    
    
    // ======================================
    // EVENT HANDLER METHODS
    // ======================================

    // actions taken when navigation buttons are clicked for an existing resource link
    // related metadata field is:   iab__Resource_Link_Menu_Actions__c
    // related flow is:             iab__Imhotep_ResourceLink_MenuActions
    openMenuActionsProjectResourceFlow(event) {

        // determine which action to take
        this.selectedAction = event.detail.value;
        
        // determine which resource link was clicked on
        this.selectedResource = event.currentTarget.dataset.id;
        
        // EDIT RESOURCE LINK (open flow)
        const result = ImhotepFlowModal.open({
            size: 'small',
            label: this.label.ActionEditResourceLinkLabel2,
            flowAPIName: this.activeMetadata.iab__Resource_Link_Menu_Actions__c,
            inputVariables: [
                {
                    name: 'recordId',
                    type: 'String',
                    value: this.selectedResource
                },
                {
                    name: 'inputSelectedAction',
                    type: 'String',
                    value: this.selectedAction
                }
            ]
        }).then((result) => {
            // if modal closed with X button, promise returns result = 'undefined'
            // if modal closed with OK button, promise returns result = 'okay'
            // if modal closed when a flow finishes, promise returns result = 'okay'
            refreshApex(this.wiredResources);
        });
    }
    
    
    
    // open flow to create a new resource link when the button is clicked
    // related metadata field is:   iab__Resource_Link_New__c
    // related flow is:             iab__Imhotep_ResourceLink_New
    openNewResourceLinkFlow(event) {
        const result = ImhotepFlowModal.open({
            size: 'small',
            label: this.label.ActionNewResourceLinkLabel,
            flowAPIName: this.activeMetadata.iab__Resource_Link_New__c,
            inputVariables: [
                {
                    name: 'recordId',
                    type: 'String',
                    value: this.projectId
                }
            ]
        }).then((result) => {
            // if modal closed with X button, promise returns result = 'undefined'
            // if modal closed with OK button, promise returns result = 'okay'
            // if modal closed when a flow finishes, promise returns result = 'okay'
            refreshApex(this.wiredResources);
        });
    }

}