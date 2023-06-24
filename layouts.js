/**
 * Elastic Layouts plugin script
 *
 * @licstart  The following is the entire license notice for the
 * JavaScript code in this file.
 *
 * Copyright (C) Philip Weir
 *
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 */

"use strict";

function rcube_elastic_layouts_ui()
{
    var prefs, layout = {
            menu: $('#layout-menu'),
            sidebar: $('#layout-sidebar'),
            list: $('#layout-list'),
            content: $('#layout-content'),
        };

    this.toggle_list_selection = toggle_list_selection;
    this.get_list_layout = get_list_layout;

    setup();

    function setup()
    {
        if (rcmail.is_framed() && $('.formcontent').length > 0) {
            // Set the scrollable parent object for the table's fixed header
            rcube_list_widget.prototype.container = 'div.formcontent';
        }

        rcmail
            .addEventListener('layout-change', mail_layout)
            .addEventListener('skin-resize', resize)
            .addEventListener('menu-open', menu_open);

        $('.column-resizer').on('mousemove', function() {
            if ($('.messagelist').hasClass('layout-list')) {
                rcmail.message_list.resize();
            }

            mail_layout();
        });
    };

    function toggle_list_selection(obj, list_id)
    {
        if ($(obj).is('.active')) {
            $('#' + list_id + ',#' + list_id + '-fixedcopy').toggleClass('withselection');
            var list = $('#' + list_id).data('list');
            rcmail[list].resize();
        }
    };

    function mail_layout(p)
    {
        if (rcmail.env.task != 'mail' || rcmail.env.action != '')
            return;

        var cur_layout = p ? p.new_layout : rcmail.env.layout,
            list_header = layout.list.find('.header'),
            content_header = layout.content.find('.header'),
            current_layout = get_list_layout(cur_layout),
            mode = UI.get_screen_mode(),
            reset_layout = function() {
                rcmail.env.contentframe = cur_layout == 'list' ? null : 'messagecontframe';
                $('#layout-list > .iframe-wrapper').appendTo('#layout-content');
                $('.iframe-wrapper > .column-resizer').remove();
            };

        if (cur_layout == 'desktop' || cur_layout == 'list') {
            // when in 'list' mode remove any inline styles like those applied by the splitter
            layout.list.removeAttr('style');
        }

        if (mode == 'phone' || mode == 'small') {
            // on small screens the layout is always widescreen
            cur_layout = 'widescreen';
        }
        else if (cur_layout == 'desktop' && $(window).height() < 600) {
            // do not use desktop layout on short screens
            cur_layout = 'list';
        }

        if (cur_layout == 'desktop' || cur_layout == 'list') {
            // hide the fixed header until the message list is loaded (wait for correct col widths)
            $('#messagelist-fixedcopy').data('header-hidden', true).hide();

            if (!$('#layout').hasClass('layout-' + cur_layout)) {
                reset_layout();
                content_header.children().attr('data-source', 'content-header').appendTo(list_header);

                if (cur_layout == 'desktop') {
                    $('#layout-content > .iframe-wrapper').appendTo('#layout-list');
                    splitter_init();
                }

                $('#layout').removeClass().addClass('layout-' + cur_layout);
            }
        }
        else if (list_header.find("[data-source='content-header']").length > 0) {
            reset_layout();
            list_header.find("[data-source='content-header']").appendTo(content_header);
            $('#layout').removeClass().addClass('layout-widescreen');
            current_layout = 'widescreen';
        }

        if (!$('.messagelist').hasClass('layout-' + current_layout)) {
            $('.messagelist').removeClass('layout-widescreen layout-list').addClass('layout-' + current_layout);
            $('.listing-hover-menu')[current_layout == 'widescreen' ? 'removeClass' : 'addClass']('hidden');

            if (p) {
                // the user has changed layout mode, redraw the UI
                rcmail.env.layout = cur_layout;
                resize();
            }
            else {
                // refresh the message list because list format has changed
                rcmail.command('list');
            }
        }
    };

    function get_list_layout(cur_layout = rcmail.env.layout)
    {
        var list_layout = cur_layout,
            mode = UI.get_screen_mode();

        if (mode == 'phone' || mode == 'small') {
            list_layout = 'widescreen';
        }
        else if (cur_layout == 'widescreen' && $('#layout-list').width() > 740) {
            list_layout = 'list';
        }
        else if (cur_layout == 'desktop') {
            list_layout = 'list';
        }
        else if (cur_layout == 'list' && $(window).width() < 1000) {
            list_layout = 'widescreen';
        }

        return list_layout;
    };

    function resize(p)
    {
        mail_layout();

        $('.header > ul.menu', layout.list).filter("[data-source='content-header']").removeClass('popupmenu');

        if (rcmail.env.layout == 'desktop' || rcmail.env.layout == 'list')
            layout.sidebar[!UI.is_mobile() ? 'removeClass' : 'addClass']('hidden');
    }

    /**
     * Handler for menu-open event
     */
    function menu_open(p)
    {
        if (p.name == 'messagelistmenu') {
            $('select[name="layout"]').val(rcmail.env.layout);
        }
        else if (p.name == 'messagelistcolsmenu') {
            menu_collist(p);
        }
    };

    /**
     * Messages list columns options dialog
     */
    function menu_collist(obj)
    {
        var content = $('#coloptions-menu'),
            dialog = content.clone(true);

        // set form values
        $.each(rcmail.env.listcols, function() {
            $('input[name="list_col[]"][value="' + this + '"]', dialog).prop('checked', true);
        });

        // Fix id/for attributes
        $('input', dialog).each(function() { this.id = this.id + '-clone'; });
        $('label', dialog).each(function() { $(this).attr('for', $(this).attr('for') + '-clone'); });

        var save_func = function(e) {
            if (rcube_event.is_keyboard(e.originalEvent)) {
                $('#colmenulink').focus();
            }

            var cols = [];
            $.each($('input[name="list_col[]"]', dialog), function() {
                if ($(this).is(':checked')) {
                    cols.push($(this).val());
                }
            });

            rcmail.set_list_options(cols, rcmail.env.sort_col, rcmail.env.sort_col, rcmail.env.threading, rcmail.env.layout);
            return true;
        };

        dialog = rcmail.simple_dialog(dialog, rcmail.gettext('elasticlayouts.columnoptionstitle'), save_func, {
            closeOnEscape: true,
            minWidth: 400
        });
    };

    /**
     * Create a splitter (resizing) element in desktop layout
     */
    function splitter_init()
    {
        var node = $('#layout-list > .iframe-wrapper'),
            key = 'mail.messagecontframe',
            height = get_pref(key),
            set_height = function(height) {
                node.css('height', Math.max(300, height));
            };

        $('<div class="column-resizer">')
            .appendTo(node)
            .on('mousedown', function(e) {
                var ts, splitter = $(this), offset = node.position().top;

                // Makes col-resize cursor follow the mouse pointer on dragging
                // and fixes issues related to iframes
                splitter.addClass('active');

                // Disable selection on document while dragging
                // It can happen when you move mouse out of window, on top
                document.body.style.userSelect = 'none';

                // Start listening to mousemove events
                $(document)
                    .on('mousemove.resizer', function(e) {
                        // Use of timeouts makes the move more smooth in Chrome
                        clearTimeout(ts);
                        ts = setTimeout(function() {
                            offset = node.position().top;

                            var cursor_position = rcube_event.get_mouse_pos(e).y,
                                height = node.height() + (offset - cursor_position)

                            set_height(height);
                        }, 5);
                    })
                    .on('mouseup.resizer', function() {
                        // Remove registered events
                        $(document).off('.resizer');
                        $('iframe').off('.resizer');
                        document.body.style.userSelect = 'auto';

                        // Set back the splitter width to normal
                        splitter.removeClass('active');

                        // Save the current position (width)
                        save_pref(key, node.height());
                    });
            });

        if (height) {
            set_height(height);
        }
    };

    /**
     * Get preference stored in browser
     */
    function get_pref(key)
    {
        if (!prefs) {
            prefs = rcmail.local_storage_get_item('prefs.elastic', {});
        }

        // fall-back to cookies
        if (prefs[key] == null) {
            var cookie = rcmail.get_cookie(key);
            if (cookie != null) {
                prefs[key] = cookie;

                // copy value to local storage and remove cookie (if localStorage is supported)
                if (rcmail.local_storage_set_item('prefs.elastic', prefs)) {
                    rcmail.set_cookie(key, cookie, new Date());  // expire cookie
                }
            }
        }

        return prefs[key];
    };

    /**
     * Saves preference value to browser storage
     */
    function save_pref(key, val)
    {
        prefs[key] = val;

        // write prefs to local storage (if supported)
        if (!rcmail.local_storage_set_item('prefs.elastic', prefs)) {
            // store value in cookie
            var exp = new Date();
            exp.setYear(exp.getFullYear() + 1);
            rcmail.set_cookie(key, val, exp);
        }
    };
}

var UI_layouts = new rcube_elastic_layouts_ui();

// Override Elastic list selection toggle
UI.toggle_list_selection = UI_layouts.toggle_list_selection;

// Inject the layout option into the list options dialog save function
rcmail.set_list_options_core = rcmail.set_list_options;
rcmail.set_list_options = function(cols, sort_col, sort_order, threads, layout)
{
    var layout = $('select[name="layout"]:visible').val();
    rcmail.set_list_options_core(cols, sort_col, sort_order, threads, layout);
};

// Inject the layout option into the add_message_row function
rcmail.add_message_row_core = rcmail.add_message_row;
rcmail.add_message_row = function(uid, cols, flags, attop)
{
    rcmail.add_message_row_core(uid, cols, flags, attop);

    if (rcmail.env.msglist_layout == 'list' && $('#messagelist-fixedcopy').data('header-hidden')) {
        // once the message list has loaded add the fixed header
        // short delay prevents headers from flickering
        $('#messagelist-fixedcopy').data('header-hidden', false);
        setTimeout(function() { $('#messagelist-fixedcopy').show(); }, 200);
    }
};

// Override list layout for list headers
rcmail.addEventListener('msglist_layout', function(p) {
    return UI_layouts.get_list_layout();
});