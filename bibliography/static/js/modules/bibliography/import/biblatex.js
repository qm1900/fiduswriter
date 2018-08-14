import {addAlert, makeWorker} from "../../common"

const ERROR_MSG = {
    'no_entries': gettext('No bibliography entries could be found in import file.'),
    'entry_error': gettext('An error occured while reading a bibtex entry'),
    'unknown_field': gettext('Field cannot not be saved. Fidus Writer does not support the field.'),
    'unknown_type': gettext('Entry has been saved as "misc". Fidus Writer does not support the entry type.'),
    'unknown_date': gettext('Field does not contain a valid EDTF string.'),
    'server_save': gettext('The bibliography could not be updated')
}


export class BibLatexImporter {
    constructor(fileContents, bibDB, csrfToken, addToListCall, callback, showAlerts=true) {
        this.fileContents = fileContents
        this.bibDB = bibDB
        this.csrfToken = csrfToken
        this.addToListCall = addToListCall
        this.callback = callback
        this.showAlerts = showAlerts
    }

    init() {
        let importWorker = makeWorker(`${$StaticUrls.transpile.base$}biblatex_import_worker.js?v=${$StaticUrls.transpile.version$}`);
        importWorker.onmessage = message => this.onMessage(message.data)
        importWorker.postMessage({fileContents: this.fileContents, csrfToken: this.csrfToken, domain: window.location.origin})
    }

    onMessage(message) {
        switch (message.type) {
            case 'error':
            case 'warning':
                let errorMsg = ERROR_MSG[message.errorCode]
                if (!errorMsg) {
                    errorMsg = gettext('There was an issue with the bibtex import')
                }
                if (message.errorType) {
                    errorMsg += `, error_type: ${message.errorType}`
                }
                if (message.key) {
                    errorMsg += `, key: ${message.key}`
                }
                if (message.type_name) {
                    errorMsg += `, entry: ${message.type_name}`
                }
                if (message.field_name) {
                    errorMsg += `, field_name: ${message.field_name}`
                }
                if (message.entry) {
                    errorMsg += `, entry: ${message.entry}`
                }
                if (this.showAlerts) {
                    addAlert(message.type, errorMsg)
                }
                break
            case 'savedBibEntries':
                // New entries already saved to database
                this.bibDB.updateLocalBibEntries(message.tmpDB, message.idTranslations)
                let newIds = message.idTranslations.map(idTrans => idTrans[1])
                this.addToListCall(newIds)
                break
            case 'unsavedBibEntries':
                // New entries. Not saved as there was no server connector. Used when pasting into document.
                this.bibDB.saveBibEntries(message.tmpDB, true).then(
                    idTranslations => {
                        let newIds = idTranslations.map(idTrans => idTrans[1])
                        this.addToListCall(newIds)
                    }
                )
                break
            default:
                break
        }
        if (message.done) {
            if (this.callback) {
                this.callback()
            }
        }
    }

}
