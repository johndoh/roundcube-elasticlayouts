<?php

/**
 * Elastic Layouts
 *
 * Plugin to add "list mode" display to Elastic skin
 *
 * @author Philip Weir
 *
 * Copyright (C) Philip Weir
 *
 * This program is a Roundcube (https://roundcube.net) plugin.
 * For more information see README.md.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Roundcube. If not, see https://www.gnu.org/licenses/.
 */
class elasticlayouts extends rcube_plugin
{
    public $task = 'mail|settings';
    private $rcube;
    private $dont_override = array();

    public function init()
    {
        $this->rcube = rcube::get_instance();

        // this plugin only works with Elastic skin
        if ($this->rcube->config->get('skin') == 'elastic') {
            // set supported layouts
            $this->rcube->config->set('supported_layouts', array('widescreen', 'desktop', 'list'), true);
            $this->add_texts('localization/');

            if ($this->rcube->task == 'mail' && $this->rcube->action == '') {
                $this->rcube->output->add_label('elasticlayouts.columnoptionstitle');
                $this->include_stylesheet('styles/styles.css');

                $this->dont_override = $this->rcube->config->get('dont_override', array());

                $this->add_hook('template_object_messages', array($this, 'message_list'));
                $this->add_hook('template_container', array($this, 'template_container'));
                $this->add_hook('render_page', array($this, 'render_page'));
            }
        }
    }

    public function message_list($attrib)
    {
        unset($attrib['content']);

        $list_options = array(
            'optionsmenuicon'  => !in_array('list_cols', $this->dont_override),
            'optionsmenuref'   => 'messagelistcolsmenu',
            'optionsmenulabel' => 'elasticlayouts.columnoptions',
            'optionsmenuid'    => 'colmenulink'
        );

        // rebuild the message list template object with new params
        $attrib['content'] = call_user_func('rcmail_message_list', $attrib + $list_options);

        return $attrib;
    }

    public function template_container($attrib)
    {
        if ($attrib['name'] == 'listoptions' && !in_array('layout', $this->dont_override)) {
            // layout option in list menu
            $field_id = 'listoptions-layout';

            $select = new html_select(array('name' => 'layout', 'id' => $field_id));
            $select->add($this->rcube->gettext('layoutwidescreendesc'), 'widescreen');
            $select->add($this->rcube->gettext('layoutdesktopdesc'), 'desktop');
            $select->add($this->rcube->gettext('layoutlistdesc'), 'list');

            $select_div = html::div('col-sm-8', $select->show($this->rcube->config->get('layout', 'widescreen')));
            $label = html::label(array('for' => $field_id, 'class' => 'col-form-label col-sm-4'), rcube::Q($this->rcube->gettext('layout')));
            $content = html::div('form-group row hidden-phone hidden-small', $label . $select_div);

            $attrib['content'] .= $content;
        }

        return $attrib;
    }

    public function render_page($attrib)
    {
        $html = '';

        if (!in_array('list_cols', $this->dont_override)) {
            // columns selection menu
            $required_cols = array('threads', 'subject');
            $cols = array(
                'threads' => 'threads',
                'subject' => 'subject',
                'fromto' => 'fromto',
                'from' => 'from',
                'to' => 'to',
                'replyto' => 'replyto',
                'cc' => 'cc',
                'date' => 'date',
                'size' => 'size',
                'status' => 'readstatus',
                'attachment' => 'attachment',
                'flag' => 'flag',
                'priority' => 'priority'
            );

            $lis = array();
            foreach ($cols as $name => $label) {
                $props = array('type' => 'checkbox', 'id' => 'listmodechk-' . $name, 'name' => 'list_col[]', 'value' => $name);
                if (in_array($name, $required_cols)) {
                    $props['disabled'] = 'disabled';
                }

                $span = html::span(null, rcube::Q($this->rcube->gettext($label)));
                $input = new html_checkbox($props);
                $label = html::label(in_array($name, $required_cols) ? array('class' => 'disabled') : array(), $input->show() . ' ' . $span);

                $lis[] = html::tag('li', null, $label);
            }

            $col_size = round(count($cols) / 2);
            $col1 = html::tag('ul', 'proplist', implode('', array_slice($lis, 0, $col_size)));
            $col2 = html::tag('ul', 'proplist', implode('', array_slice($lis, $col_size)));

            $col1 = html::div('col-sm-6', $col1);
            $col2 = html::div('col-sm-6', $col2);

            $row = html::div('row', $col1 . $col2);

            $title = html::tag('h3', array('id' => 'aria-label-coloptions', 'class' => 'voice'), rcube::Q($this->gettext('arialabelmessagecoloptions')));
            $html .= html::div(array('id' => 'coloptions-menu', 'class' => 'popupmenu propform', 'role' => 'dialo', 'aria-labelledby' => 'aria-label-coloptions'), $title . $row);
        }

        // list mode JS
        $html .= html::script(array('src' => $this->api->url . 'elasticlayouts/layouts.js'));

        $attrib['content'] = str_replace('</body>', $html . '</body>', $attrib['content']);

        return $attrib;
    }
}
