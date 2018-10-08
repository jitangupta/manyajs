(function (factory) {
    "use strict";
    if (typeof define === "function" && define.amd) {
        define(["jquery"], factory);
    } else if (typeof exports !== "undefined") {
        module.exports = factory(require("jquery"));
    } else {
        factory(window.jQuery);
    }
}(function ($) {
    "use strict";

    var pluginName = "manya";

    var defaults = {
        liveEditing: false,
        regex: {
            email: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            mobile: /^[6789]\d{9}$/,
            password: /^[A-Za-z0-9]+$/,
            name: /^[a-zA-Z]*$/,
            image: /([/|.|\w|\s|-])*\.(?:jpg|gif|png)/,
            dob: /^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/
        },
        onInit: function () { }
    };

    var Manya = function (element, options) {
        this.button = $(element);
        this.settings = $.extend({}, defaults, options);

        this.init();

        return this;
    };

    Manya.prototype.init = function () {
        var widget = this;
        console.log("👍 Manya initialized");
        var invalidAny = false;

        this.button.on("click", function () {
            console.log("button clicked");
            invalidAny = false;
            var formName = $(this.form).attr("id");

            //for required
            $("#" + formName + " [val-type]").each(function () {
                if (!widget.ElementValidation($(this), $(this).attr("val-type"))) {
                    invalidAny = true;
                }
            });

            if (!invalidAny) {
                $("#" + formName + " [regex]:not([val-type]").each(function () {
                    if ($(this).val() !== '') {
                        if (!widget.verifyInput($(element).val(), $(element).attr('regex'))) {
                            widget.ShowError(element, $(element).attr('regex-error') === undefined ? 'Invalid ' + $(element).attr('name') : $(element).attr('regex-error'), $(element).attr('with-parent'));
                            invalidAny = true;
                        }
                        //Remove Error
                        else {
                            widget.RemoveError(element, $(element).attr('with-parent'));
                        }
                    }
                });
            }

            if (invalidAny) {
                return false;
            }
            return true;
        });

        //on blur or change verify, remove or add error
        $('[val-type]').on('blur, change', function () {
            widget.ElementValidation($(this), $(this).attr('val-type'));
        });

        //regex realtime verification
        if (widget.liveEditing) {
            $('[regex]').on('keyup', function () {
                widget.ElementValidation($(this), 'text');
            });
        }

        //input blur, if the field is empty, removes error
        $('[regex]').on('blur', function () {
            if ($(this).attr('val-type') === undefined && $(this).val() === '') {
                widget.RemoveError($(this), $(this).attr('with-parent'));
            }
        });

        ////input blur, show suggestion
        //$('[suggestion]').on('blur', function () {
        //    if ($(this).attr('val-type') === undefined && $(this).val() === '') {
        //        widget.RemoveError($(this), $(this).attr('with-parent'));
        //    }
        //});

        this.settings.onInit.call(this.element);
        if (invalidAny) {
            return false;
        }
        return true;
    };

    Manya.prototype.ElementValidation = function ElementValidation(element, type) {
        var isValid = true;
        switch (type) {
            case 'text':
                isValid = this.VerifyText(element);
                break;

            case 'select':
                isValid = this.VerifyDropdown(element);
                break;

            case 'check':
                isValid = this.VerifyCheckbox(element);
                break;

            case 'radio':
                isValid = this.VerifyRadio(element);
                break;

            case 'file':
                isValid = this.VerifyFile(element);
                break;

            default:
                break;
        }
        return isValid;
    };

    //Email Suggestion
    Manya.prototype.EmailSuggestion = function Suggest($element) {
        try {
            let forSuggestion = $element.val().split("@");
            if (forSuggestion.length > 1) {
                let domain = forSuggestion[1].split('.')[0];
                let suggestedEmail = "";
                const emailSuggestions = this.LoadAvailableEmailSuggestions();
                const emailDomains = this.LoadEmailDomains();
                let isSuggestionFound = false;
                for (let i = 0; i < emailSuggestions.length; i++) {
                    let domainSuggestions = emailSuggestions[i];

                    if (domainSuggestions.includes(domain)) {
                        suggestedEmail = emailDomains[i];
                        console.log("found suggestion => " + suggestedEmail);
                        isSuggestionFound = true;
                        break;
                    }

                }

                if (isSuggestionFound) {
                    //Show suggestion here
                    this.ShowSuggestion($element, suggestedEmail, domain);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    //Available Email Suggestions
    Manya.prototype.LoadAvailableEmailSuggestions = function () {
        var emailSuggestions = [
            ["gmai", "gail", "gmial", "gmal"],
            ["outlok", "outlk", "otlk"],
            ["hotmal", "hotmai", "hotmil"]
        ];
        return emailSuggestions;
    };

    //Email Domains
    Manya.prototype.LoadEmailDomains = function () {
        var emailDomains = ['gmail', 'outlook', 'hotmail'];
        return emailDomains;
    };

    //Validation Types
    Manya.prototype.VerifyText = function VerifyText(element) {
        var isValid = true;
        let $element = $(element);
        if ($element.val() === '' && $element.attr('val-type') !== undefined) {
            this.ShowError(element, $element.attr('val-error') === undefined ? $element.attr('name') + ' is required' : $element.attr('val-error'), $element.attr('with-parent'));
            isValid = false;
        } else {
            if ($element.attr('regex') !== undefined) {
                if (!this.verifyInput($element.val(), $element.attr('regex'))) {
                    this.ShowError(element, $element.attr('regex-error') === undefined ? 'Invalid ' + $element.attr('name') : $element.attr('regex-error'), $element.attr('with-parent'));
                    isValid = false;
                }
                //Remove Error
                else {
                    this.RemoveError(element, $element.attr('with-parent'));
                    //show suggestion here
                    let suggestion = $element.attr('suggestion');
                    if (suggestion !== undefined) {
                        switch (suggestion) {

                            case "email":
                                this.EmailSuggestion($element);
                                break;

                            default:
                                console.warn('Your suggestion not found in ManyaJS');
                                break;
                        }
                    }
                }
            } else {
                this.RemoveError(element, $element.attr('with-parent'));
            }
        }
        return isValid;
    };
    Manya.prototype.VerifyCheckbox = function VerifyCheckbox(element) {
        var isValid = true;
        if (!$(element).prop('checked')) {
            this.ShowError(element, $(element).attr('val-error') === undefined ? 'Please check ' + $(element).attr('name') : $(element).attr('val-error'), $(element).attr('with-parent'));
            isValid = false;
        } else {
            this.RemoveError(element, $(element).attr('with-parent'));
        }
        return isValid;
    };
    Manya.prototype.VerifyDropdown = function VerifyDropdown(element) {
        var isValid = true;

        if ($(element).val().toLowerCase().indexOf('select') !== -1) {
            this.ShowError(element, $(element).attr('val-error') === undefined ? 'select ' + $(element).attr('name') : $(element).attr('val-error'), $(element).attr('with-parent'));
            isValid = false;
        } else {
            this.RemoveError(element, $(element).attr('with-parent'));
        }
        return isValid;
    };
    Manya.prototype.VerifyRadio = function VerifyRadio(element) {
        var isValid = true;
        var isSelectedAny = false;

        $('input[type=radio][name=' + element[0].name + ']').each(function (key, ele) {
            if ($(ele).prop('checked')) {
                isSelectedAny = true;
                return;
            }
        });

        if (!isSelectedAny) {
            this.ShowError(element, $(element).attr('val-error') === undefined ? 'Please select ' + $(element).attr('name') : $(element).attr('val-error'), $(element).attr('with-parent'));
            isValid = false;
        } else {
            this.RemoveError(element, $(element).attr('with-parent'));
        }

        return isValid;
    };
    Manya.prototype.VerifyFile = function VerifyFile(element) {
        var isValid = true;
        if ($(element).val() === '') {
            this.ShowError(element, $(element).attr('val-error') === undefined ? $(element).attr('name') + ' is required' : $(element).attr('val-error'), $(element).attr('with-parent'))
            isValid = false;
        } else {
            if ($(element).attr('regex') !== undefined) {
                //var extension = file.substr((file.lastIndexOf('.') + 1));
                if (!this.verifyInput($(element).val(), $(element).attr('regex'))) {
                    this.ShowError(element, $(element).attr('regex-error') === undefined ? 'Invalid ' + $(element).attr('name') : $(element).attr('regex-error'), $(element).attr('with-parent'));
                    isValid = false;
                }
                //Remove Error
                else {
                    this.RemoveError(element, $(element).attr('with-parent'));
                }
            } else {
                this.RemoveError(element, $(element).attr('with-parent'));
            }
        }
        return isValid;
    };

    //regex check
    Manya.prototype.verifyInput = function verifyInput($input, $type) {

        if (this.settings.regex[$type] !== undefined) {
            try {
                return this.settings.regex[$type].test($input);
            } catch {
                console.error("🙁 unable to validate input with regex " + $type);
            }
        } else {
            console.error("😰 undefined regex " + $type);
            return false;
        }
    };

    //show error
    Manya.prototype.ShowError = function ShowError(element, error, isErrorWithParent) {
        if (isErrorWithParent !== undefined) {
            $(element).parent().siblings('.help-block').text(error);
            $(element).parent().parent().addClass('has-error');
        } else {
            $(element).siblings('.help-block').text(error);
            $(element).parent().addClass('has-error');
        }
    };
    //remove error
    Manya.prototype.RemoveError = function RemoveError(element, isErrorWithParent) {
        if (isErrorWithParent !== undefined) {
            $(element).parent().siblings('.help-block').text('');
            $(element).parent().parent().removeClass('has-error');
        } else {
            $(element).siblings('.help-block').text('');
            $(element).parent().removeClass('has-error');
        }
    };

    //show suggestion
    Manya.prototype.ShowSuggestion = function ShowSuggestion($element, suggestion, domain) {
        let widget = this;
        let $sugBox = $element.siblings('.suggestion-box');
        let $sugAct = $sugBox.children('.suggested-action');
        $sugBox.children('.suggestion').text('did you mean ');
        let validText = $element.val().replace(domain, suggestion);
        $sugAct.text(validText);
        $sugAct.on('click', function () {
            $element.val(validText);
            widget.RemoveSuggestion($sugBox);
        });
    };
    //remove suggestion
    Manya.prototype.RemoveSuggestion = function RemoveSuggestion($sugBox) {
        $sugBox.children().text('');
    };

    $.fn.manya = function (options) {
        var args = arguments;

        if (typeof options === "string") {
            this.each(function () {
                var plugin = $.data(this, pluginName);

                if (plugin instanceof Manya) {
                    if (typeof plugin.methods[options] === "function") {
                        plugin.methods[options].apply(plugin, Array.prototype.slice.call(args, 1));
                    } else {
                        $.error("Methods " + options + " does not exists in jQuery.manya");
                    }
                } else {
                    $.error("unknown plugin data found by jQuery.manya");
                }
            });
        } else {
            return this.each(function () {
                if (!$.data(this, pluginName)) {
                    $.data(this, pluginName, new Manya(this, options));
                }
            });
        }

    }
}));
