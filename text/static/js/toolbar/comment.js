/**
 * This file is part of Fidus Writer <http://www.fiduswriter.com>
 *
 * Copyright (C) 2013 Takuto Kojima, Johannes Wilm
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

(function (jQuery) {
    return jQuery.widget("IKS.toolbarcomment", {
        options: {
            editable: null,
            uuid: "",
            link: true,
            image: true,
            butonCssClass: null
            // More options
        },
        populateToolbar: function (toolbar) {
            var buttonize, buttonset, commentNode, widget, range, selection, _this = this;
            widget = this;
            buttonset = $.Fidus.buttonset.prototype.createButtonset.call(this, widget.widgetName, 1);
            buttonize = function (type) {
                var button, id;
                id = "comment-" + _this.options.uuid + "-" + type;
                button = jQuery('<button></button>');
                button.makebutton({
                    label: 'Comment',
                    icon: 'icon-comment-empty',
                    editable: _this.options.editable,
                    queryState: false,
                    uuid: _this.options.uuid,
                    cssClass: _this.options.buttonCssClass
                });
                button.attr('class', 'fw-button fw-light fw-large fw-square');
                buttonset.append(button);
                button.bind("click", function (event) {
                    if ($(this).hasClass('disabled')) {
                        // Comments have been disabled.
                        return false;
                    }

                    selection = rangy.getSelection();
                    range = selection.getRangeAt(0);

                    insideComment = jQuery(range.startContainer).closest('.comment')[0];
                    if (insideComment) {
                        commentNode = insideComment;
                    } else {
                        
                        insideCitation = jQuery(range.startContainer).closest('.citation')[0];

                        if (insideCitation) {
                            range.selectNode(insideCitation);
                        } else if (range.collapsed) {
                            // The range is collapsed, so instead we will use the word around the selection.
                            var savedSel = rangy.saveSelection();
                            range.startContainer.parentElement.normalize();
                            rangy.restoreSelection(savedSel);
                            range = selection.getRangeAt(0);

                            // Using native range instead of rangy. This will be part of Rangy 1.3 text range module.
                            range.nativeRange.expand('word');
                            if (range.nativeRange.collapsed) {
                                // The range is still collapsed! We must have been some place where there was no word.
                                // We move the start of the range one character to the left and try again. 
                                range.moveCharLeft(true, 1);
                                range.nativeRange.expand('word');
                                
                                if (range.nativeRange.collapsed) {
                                
                                    // We decide that no comment can be placed here.
                                    console.log('could not find word');
                                    return false;
                                }
                            }
                        }
                        commentNode = document.createElement('span');
                        commentNode.classList.add('comment');
                        commentHelpers.createNewComment(commentNode);
                        if (!range.canSurroundContents()) {
                            // We cannot surround the current selection, so we grab something nearby instead
                            range.selectNode(selection.anchorNode);
                        }
                        if (range.canSurroundContents()) {
                            // A bug in rangy -- some times it claims that certain content can be surrounded, when this is not the case.
                            try {
                                range.surroundContents(commentNode);
                            } catch (err) {
                                // We give up placing a comment at the current place.
                                return false;
                            }
                        }
                    }

                    widget.options.editable.keepActivated(true);
                    commentHelpers.layoutComments();
                    return false;
                });
                return _this.element.bind("keyup paste change mouseup", function (event) {
                    var insideComment, start;
                    start = jQuery(widget.options.editable.getSelection().startContainer);
                    insideComment = jQuery(start).closest('.comments-enabled .comment')[0];
                    if (insideComment) {
                        jQuery('.comment_button').addClass('ui-state-active');
                    } else {
                        jQuery('.comment_button').removeClass('ui-state-active');
                        if (commentHelpers.deactivateAll()) commentHelpers.layoutComments();
                    }
                });
            };
            if (this.options.link) {
                buttonize("A");
            }
            if (this.options.link) {
                buttonset.buttonset();
                toolbar.append(buttonset);
                return true;
            }
        },
        _init: function () {}
    });
})(jQuery);