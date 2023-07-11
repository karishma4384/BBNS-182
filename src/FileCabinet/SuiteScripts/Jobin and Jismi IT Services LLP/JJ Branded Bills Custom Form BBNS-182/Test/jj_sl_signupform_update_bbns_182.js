/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
/*******************************************************************************
 * Branded Bills
 * BBNS-82: Branded Bill Custom Form 
 **************************************************************************************************
 *
 * Author: Jobin and Jismi IT Services LLP
 *
 * Date Created : 7-May-2022
 *
 * Description: Suitelet script is used to render the html file created for lead creation
 *
 * REVISION HISTORY
 *
 * @version 1.0 BBNS-82: 7-May-2022 : Created the initial build by JJ0198
 * @version 2.0 BBNS-153: 5-April-2023 : Created the initial build by JJ0198
 * Description:Custom record creation for submit the first step of the form
 * @version 3.0 BBNS-182: 7-July-2023 : Created the initial build by JJ0198
 * Description:Remove the phone Number field from the lead creation
 *
 **************************************************************************************************************************/
define(['N/https', 'N/search', 'N/log', 'N/record', 'N/file','N/encode'],
    function (https, search, log , record, file, encode) {

        /**
        * Constant values used for syncing the lost lead from NetSuite to Klaviyo
        */
        const API_VALUES_OBJ = {
            "URL": "https://a.klaviyo.com/api/v2/list",
            "LIST_ID": "YiE2MV",                                   // in klaviyo list name is FF | Lost Leads - Received 0 Emails
            "API_KEY": "pk_4c6c95d8fab82ab95630526785c14ad4c2",
            "PATH_PARAM": "members"
        }
        const LOST_LEAD_REC_DETAILS = {
            "first_name": "custrecord_jj_firstname_brandedbill_form",
            "last_name": "custrecord_jj_lastname_brandedbills_form",
            "email": "custrecord_jj_email_brandedbills_form"           
        }
        /**
        * @description The API request call for updating the Klaviyo list with a new lost lead
        * @param finalBodyArray Array containing the object of lead details
        */
        function lostLeadSyncApiRequest(finalBodyArray) {
            try {
                var header = [];
                header['Content-Type'] = 'application/json';
                header['Accept'] = 'application/json';
                var requestUrlConstruction = API_VALUES_OBJ.URL + '/' + API_VALUES_OBJ.LIST_ID + '/' + API_VALUES_OBJ.PATH_PARAM + '?api_key=' + API_VALUES_OBJ.API_KEY;
                var updateKlaviyoList = https.post({
                    headers: header,
                    url: requestUrlConstruction,
                    body: JSON.stringify({ profiles: finalBodyArray })
                });
                log.debug("response", { code: updateKlaviyoList.code, body: updateKlaviyoList.body, requestBody: finalBodyArray, url:requestUrlConstruction });
            } catch (err) {
                log.error("error @ lostLeadSyncApiRequest function", err)
            }
        }
        /**
        * @description This Function is used to branded bill custom record search.
        * @param email pass the email id
        */
        function brandedbillsCustomSearch(email) {
            let customrecordbeabdedbillSearchObj = search.create({
                type: "customrecord1385",
                filters:
                    [
                        ["custrecord_jj_email_brandedbills_form", "is", email]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "internalid", label: "Internal ID"
                        })
                    ]
            });
            let searchResultCount = customrecordbeabdedbillSearchObj.runPaged().count;         
            let resultArray = [];
            if (searchResultCount > 0) {
                let result = customrecordbeabdedbillSearchObj.run().getRange({
                    start: 0,
                    end: 1000
                });
                for (let j = 0; j < result.length; j++) {

                    let internalId = result[j].getValue({
                        name: "internalid",
                        label: "Internal ID"
                    });
                    resultArray.push(internalId);
                }
            }
            return resultArray;
        }
        function onRequest(context) {
            try {
                
                let fileArr = []
                if (context.request.method === 'POST') {
                    let statusparam = context.request.parameters.status;                 
                    if (statusparam === '1') {
                        let firstname = context.request.parameters.firstname.toString();
                        let lastname = context.request.parameters.lastname.toString();
                        let email1 = context.request.parameters.email.toString();
                        if (firstname != '' && lastname != '' && email1 != '') {
                            let custRecord = record.create({
                                type: 'customrecord1385',
                                isDynamic: true
                            });
                            if (firstname) {
                                custRecord.setValue({
                                    fieldId: 'custrecord_jj_firstname_brandedbill_form',
                                    value: firstname
                                });
                            }
                            if (lastname) {
                                custRecord.setValue({
                                    fieldId: 'custrecord_jj_lastname_brandedbills_form',
                                    value: lastname
                                });
                            }
                            if (email1) {
                                custRecord.setValue({
                                    fieldId: 'custrecord_jj_email_brandedbills_form',
                                    value: email1
                                });
                            }
                            let recId = custRecord.save();                            
                            let finalBodyObj={};
                            finalBodyObj.id = recId;
                            finalBodyObj.first_name = firstname;
                            finalBodyObj.last_name = lastname;
                            finalBodyObj.email = email1;
                            finalBodyObj.organization = "";                           
                            let finalBodyArray = [finalBodyObj];
                            lostLeadSyncApiRequest(finalBodyArray);
                        }
                    }
                    if (statusparam === '2') {
                        var fileValue = context.request.parameters.document;
                        var fileValue2 = JSON.parse(fileValue);                     
                        var fileContent = fileValue2.file;
                        var nameOfFile = fileValue2.name;
                        var isMobile = context.request.parameters.isMobile;                      
                        var isTablet = context.request.parameters.isTablet;                       
                        var isDesktop = context.request.parameters.isDesktop;
                        var firstname = context.request.parameters.firstname.toString();
                        var lastname = context.request.parameters.lastname.toString();
                        var category = context.request.parameters.industry.toString();
                        var unitVal = context.request.parameters.units.toString();
                        var email1 = context.request.parameters.email.toString();                     
                        var product = context.request.parameters.product;
                        var companyname = context.request.parameters.companyname.toString();
                        var comments = context.request.parameters.comments.toString();
                        var state = context.request.parameters.state.toString();
                        var utm_source1 = context.request.parameters.url_parameter.toString();                       
                        try {
                            if (utm_source1) {
                                var parts = utm_source1.split(/[#\?&]/g); // split the string with these characters
                                // find the piece with the key `iamlookingforthis`
                                var filteredParts = parts.filter(function (part) {
                                    return part.split('=')[0] === 'utm_source';
                                });                              
                                var filteredParts1 = parts.filter(function (part) {
                                    return part.split('=')[0] === 'fbclid';
                                });                               
                                var filteredParts2 = parts.filter(function (part) {
                                    return part.split('=')[0] === 'gclid';
                                });                               
                                // from the filtered array, get the first [0]
                                // split the value and key, and grab the value [1]
                                if (filteredParts) {
                                    var utm_source = filteredParts[0].split('=')[1];                                  
                                }
                            }
                        } catch (e) {
                            log.error("error split", e)
                        }
                        var emailsearch = brandedbillsCustomSearch(email1);                       
                        if (emailsearch.length > 0) {
                            for (var i = 0; i < emailsearch.length; i++) {
                                // var custrecordInternalId = emailsearch.values();
                                record.delete({
                                    type: 'customrecord1385',
                                    id: emailsearch[i]
                                })
                            }
                        }
                        var objRecord = record.create({
                            type: record.Type.LEAD,
                            isDynamic: true,
                            ignoreMandatoryFields: true
                        });
                        if (firstname) {
                            objRecord.setValue({
                                fieldId: 'firstname',
                                value: firstname
                            });
                        }
                        if (lastname) {
                            objRecord.setValue({
                                fieldId: 'lastname',
                                value: lastname
                            });
                        }
                        if (category) {
                            objRecord.setValue({
                                fieldId: 'category',
                                value: category
                            });
                        }
                        if (unitVal) {
                            objRecord.setValue({
                                fieldId: 'custentity_units_expected_to_order',
                                value: unitVal
                            });
                        }
                        if (email1) {
                            objRecord.setValue({
                                fieldId: 'email',
                                value: email1
                            });
                        }                        
                        if (companyname) {
                            objRecord.setValue({
                                fieldId: 'companyname',
                                value: companyname
                            });
                        }
                        try {
                            if (utm_source) {
                                objRecord.setValue({
                                    fieldId: 'custentityjj_source_medium',
                                    value: utm_source
                                });
                            } else if (filteredParts1) {
                                objRecord.setValue({
                                    fieldId: 'custentityjj_source_medium',
                                    value: "Facebook"
                                });
                            } else if (filteredParts2) {
                                objRecord.setValue({
                                    fieldId: 'custentityjj_source_medium',
                                    value: "Google Ads"
                                });
                            } else {
                                objRecord.setValue({
                                    fieldId: 'custentityjj_source_medium',
                                    value: "Source Unknown"
                                });
                            }
                        } catch (e) {
                            log.error("error set", e)
                        }

                        objRecord.setValue({
                            fieldId: 'entitystatus',
                            value: 7
                        });
                        objRecord.setValue({
                            fieldId: 'pricelevel',
                            value: 7
                        });
                        if (comments) {
                            objRecord.setValue({
                                fieldId: 'comments',
                                value: comments
                            });
                        }
                        if (isMobile === 'true') {
                            objRecord.setValue({
                                fieldId: "custentity_jj_device_type",
                                value: "Mobile"
                            });
                        }
                        else if (isMobile === 'false' && isTablet === 'false' && isDesktop === 'false') {
                            objRecord.setValue({
                                fieldId: "custentity_jj_device_type",
                                value: "Desktop"
                            })
                        }
                        else {
                            objRecord.setValue({
                                fieldId: "custentity_jj_device_type",
                                value: "Other Sources"
                            })
                        }
                        if (product) {

                            objRecord.setValue({
                                fieldId: 'custentity_jj_products',
                                value: product
                            });
                        }
                        if (state) {
                            objRecord.setValue({
                                fieldId: 'state',
                                value: state
                            });
                        }
                        objRecord.setValue({
                            fieldId: 'custentity6',
                            value: true
                        });
                        objRecord.selectNewLine({
                            sublistId: 'addressbook'
                        });
                        var addressSubrecord = objRecord.getCurrentSublistSubrecord({
                            sublistId: 'addressbook',
                            fieldId: 'addressbookaddress'
                        });

                        addressSubrecord.setValue({
                            fieldId: 'addressee',
                            value: firstname
                        })

                        addressSubrecord.setValue({ fieldId: 'addressee', value: firstname })
                        addressSubrecord.setValue({ fieldId: 'addr1', value: companyname })
                        addressSubrecord.setValue({ fieldId: 'state', value: state })
                        addressSubrecord.setValue({
                            fieldId: 'defaultshipping',
                            value: true
                        });
                        objRecord.commitLine({
                            sublistId: 'addressbook'
                        });
                        var fileValue = []
                        fileValue = context.request.parameters.document
                        var fileValue2 = JSON.parse(fileValue)
                        for (var i = 0; i < fileValue2.length; i++) {
                            var fileContent = fileValue2[i].file
                            var nameOfFile = fileValue2[i].name
                            var fileName = '#' + (i + 1) + "_" + (new Date()).getTime() + "_" + nameOfFile;
                            //create file in file cabinet
                            var typeOfFile = nameOfFile.split('.');                            
                            var fileTyp = typeOfFile[typeOfFile.length - 1];
                            // var fileTyp =  fileValue2[i].file.split('data:')[1].split(";")[0];                          
                            if (fileContent) {
                                try {
                                    var fileType1 = fileTyp.toLowerCase();
                                    if (fileType1 == 'pdf') {
                                        var fileForData = file.create({
                                            name: fileName,
                                            fileType: file.Type.PDF,
                                            contents: fileContent.split("base64,")[1],
                                            folder: 613129,
                                            isOnline: true
                                        });
                                    } else if (fileType1 == 'doc' || fileType1 == 'docx') {
                                        //WORD
                                        var fileForData = file.create({
                                            name: fileName,
                                            fileType: file.Type.WORD,
                                            contents: fileContent.split("base64,")[1],
                                            folder: 613129,
                                            isOnline: true
                                        });
                                    } else if (fileType1 == 'txt') {
                                        var base64EncodedString = encode.convert({
                                            string: fileContent.split("base64,")[1],
                                            inputEncoding: encode.Encoding.BASE_64,
                                            outputEncoding: encode.Encoding.UTF_8
                                        });
                                        var fileForData = file.create({
                                            name: fileName,
                                            fileType: file.Type.PLAINTEXT,
                                            contents: base64EncodedString,
                                            encoding: file.Encoding.UTF8,
                                            folder: 613129,
                                            isOnline: true
                                        });
                                    } else if (fileType1 == 'jpeg' || fileType1 == 'jpg') {

                                        var fileForData = file.create({
                                            name: fileName,
                                            fileType: file.Type.JPGIMAGE,
                                            contents: fileContent.split("base64,")[1],
                                            folder: 613129,
                                            isOnline: true
                                        });
                                    } else if (fileType1 == 'png') {

                                        var fileForData = file.create({
                                            name: fileName,
                                            fileType: file.Type.PNGIMAGE,
                                            contents: fileContent.split("base64,")[1],
                                            folder: 613129,
                                            isOnline: true
                                        });
                                    }
                                    var fileID = fileForData.save();                                    
                                    if (fileID) {
                                        fileArr.push(fileID);
                                    }
                                } catch (error) {
                                    log.error("error@documentsettings", error)
                                }
                            }
                        }
                        if (category != "12") {
                            objRecord.setValue({
                                fieldId: 'leadsource',
                                value: 6
                            });
                        }
                        var recordId = objRecord.save({
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        });
                        if (fileArr.length > 0) {
                            for (var i = 0; i < fileArr.length; i++) {
                                record.attach({
                                    record: {
                                        type: 'file',
                                        id: fileArr[i]
                                    },
                                    to: {
                                        type: 'lead',
                                        id: recordId
                                    }
                                });
                            }
                        }
                    }
                } else {
                    try {
                        var fileHTML = file.load({
                            id: 1098465 //HTML File id
                        });
                        //get contents
                        var htmlContent1 = fileHTML.getContents();
                        context.response.write(htmlContent1);
                    } catch (e) {
                        log.error("Error@htmlfileresponse", e)
                    }
                }
            } catch (error) {
                log.error('error@onRequest', error);
            }
        }
        return {
            onRequest: onRequest
        };
    });
