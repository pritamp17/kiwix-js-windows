/**
 * uiUtil.js : Utility functions for the User Interface
 * 
 * Copyright 2013-2014 Mossroy and contributors
 * License GPL v3:
 * 
 * This file is part of Kiwix.
 * 
 * Kiwix is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Kiwix is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Kiwix (file LICENSE-GPLv3.txt).  If not, see <http://www.gnu.org/licenses/>
 */
'use strict';
define([], function() {
    
    /**
     * Creates a Blob from the given content, then a URL from this Blob
     * And put this URL in the attribute of the DOM node
     * 
     * This is useful to inject images (and other dependencies) inside an article
     * 
     * @param {Object} jQueryNode
     * @param {String} nodeAttribute
     * @param {Uint8Array} content
     * @param {String} mimeType
     */
    function feedNodeWithBlob(jQueryNode, nodeAttribute, content, mimeType) {
        var blob = new Blob([content], { type: mimeType }, {oneTimeOnly: true});
        var url = URL.createObjectURL(blob);
        /*jQueryNode.on('load', function () {
            URL.revokeObjectURL(url);
        });*/
        jQueryNode.attr(nodeAttribute, url);
    }
        
    var regexpRemoveUrlParameters = new RegExp(/([^\?]+)\?.*$/);
    
    function removeUrlParameters(url) {
        if (regexpRemoveUrlParameters.test(url)) {
            return regexpRemoveUrlParameters.exec(url)[1];
        } else {
            return url;
        }
    }

    function TableOfContents(articleDoc) {
        this.doc = articleDoc;
        this.headings = this.doc.querySelectorAll("h1, h2, h3, h4, h5, h6");

        this.getHeadingObjects = function () {
            var headings = [];
            for (var i = 0; i < this.headings.length; i++) { 
                var element = this.headings[i];
                var obj = {};
                obj.id = element.id;
                var objectId = element.innerHTML.match(/\bid\s*=\s*["']\s*([^"']+?)\s*["']/i);
                obj.id = obj.id ? obj.id : objectId && objectId.length > 1 ? objectId[1] : "";
                obj.index = i;
                obj.textContent = element.textContent;
                obj.tagName = element.tagName;
                headings.push(obj);
            }
            return headings;
        }
    }

    /**
     * Checks whether an element is fully or partially in view
     * This is useful for progressive download of images inside an article
     *
     * @param {Object} el
     * @param {Boolean} fully
     */
    function isElementInView(el, fully) {
        var elemTop = el.getBoundingClientRect().top;
        var elemBottom = el.getBoundingClientRect().bottom;

        var isVisible = fully ? elemTop < window.innerHeight && elemBottom >= 0 :
            elemTop >= 0 && elemBottom <= window.innerHeight;
        return isVisible;
    }


    function makeReturnLink(title) {
        //Abbreviate title if necessary
        var shortTitle = title.substring(0, 25);
        shortTitle = shortTitle == title ? shortTitle : shortTitle + "..."; 
        var link = '<h4 style="font-size:' + ~~(params.relativeUIFontSize * 1.4 * 0.14) + 'px;"><a href="#">&lt;&lt; Return to ' + shortTitle + '</a></h4>';
        var rtnFunction = "(function () { setTab(); \
            if (params.themeChanged) { \
                params.themeChanged = false; \
                if (history.state !== null) {  \
                    var thisURL = decodeURIComponent(history.state.title); \
                    goToArticle(thisURL); \
                } \
            } \
        })";
        var returnDivs = document.getElementsByClassName("returntoArticle");
        for (var i = 0; i < returnDivs.length; i++) {
            returnDivs[i].innerHTML = link;
        }
        return rtnFunction;
    }

    function poll(msg) {
        document.getElementById("progressMessage").innerHTML += '<p>' + msg + '</p>';
    }

    function clear() {
        document.getElementById("progressMessage").innerHTML = "<p></p>";
    }

    /**
  * Initiates XMLHttpRequest
  * Can be used for loading local files in app context
  *
  * @param {String} file
  * @param {Function} callback
  * @returns responseText, status
  */
    function XHR(file, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function (e) {
            if (this.readyState == 4) {
                callback(this.responseText, this.status);
            }
        };
        var err = false;
        try {
            xhr.open('GET', file, true);
        }
        catch (e) {
            console.log("Exception during GET request: " + e);
            err = true;
        }
        if (!err) {
            xhr.send();
        } else {
            callback("Error", 500);
        }
    }

    function onPrintTaskRequested(printEvent) {
        var printTask = printEvent.request.createPrintTask("Kiwix Article", function (args) {
            //var innerDocument = document.getElementById('articleContent');
            var innerDocument = window.frames[0].frameElement.contentDocument;
            var innerDocument = innerDocument ? innerDocument.documentElement.innerHTML : null;
            if (!innerDocument) { console.log("*** There is nothing to print! ***"); return; }
            //var modalDiv = document.getElementById("myModal");
            //var saveModal = modalDiv.innerHTML;
            //modalDiv.innerHTML = innerDocument;
            //var printDetailedOptions = Windows.Graphics.Printing.OptionDetails.PrintTaskOptionDetails.getFromPrintTaskOptions(printTask.options);
            //printTask.options.displayedOptions.clear();
            //printTask.options.displayedOptions.push(
            //    //Windows.Graphics.Printing.StandardPrintTaskOptions.customPageRanges,
            //    Windows.Graphics.Printing.StandardPrintTaskOptions.copies,
            //    Windows.Graphics.Printing.StandardPrintTaskOptions.mediaSize,
            //    Windows.Graphics.Printing.StandardPrintTaskOptions.orientation,
            //    Windows.Graphics.Printing.StandardPrintTaskOptions.duplex);
            //printTask.options.displayedOptions.append(Windows.Graphics.Printing.StandardPrintTaskOptions.customPageRanges);

            var page = document.createDocumentFragment();
            var content = document.createElement('html');
            content.innerHTML = innerDocument;
            page.appendChild(content);

            var deferral = args.getDeferral();

            // Register the handler for print task completion event
            printTask.addEventListener("completed", onPrintTaskCompleted);

            MSApp.getHtmlPrintDocumentSourceAsync(page).then(function (source) {
                args.setSource(source);
                //source.pageRange = "1-2";
                //source.trySetPageRange("1-2");
                //window.msTemplatePrinter.pageFrom = 1;
                //window.msTemplatePrinter.pageTo = 2;
                deferral.complete();
                //modalDiv.innerHTML = saveModal;
                content.innerHTML = "";
            });
        });
    }

    function onPrintTaskCompleted(printTaskCompletionEvent) {
        // Notify the user about the failure
        if (printTaskCompletionEvent.completion === Windows.Graphics.Printing.PrintTaskCompletion.failed) {
            console.log("*** Failed to print! ***");
        } else {
            console.log("Document was sent to printer");
        }
    }

    function printUWP() {
        if (typeof Windows === "undefined") return;
        if (!(Windows.Graphics && Windows.Graphics.Printing && Windows.Graphics.Printing.PrintManager)) return;
        var printManager = Windows.Graphics.Printing.PrintManager.getForCurrentView();
        // Register for Print Contract
        printManager.addEventListener("printtaskrequested", onPrintTaskRequested);
        Windows.Graphics.Printing.PrintManager.showPrintUIAsync();
    }

    
    /**
     * Functions and classes exposed by this module
     */
    return {
        feedNodeWithBlob: feedNodeWithBlob,
        removeUrlParameters: removeUrlParameters,
        toc: TableOfContents,
        isElementInView: isElementInView,
        makeReturnLink: makeReturnLink,
        poll: poll,
        clear: clear,
        XHR: XHR,
        printUWP: printUWP
    };
});
