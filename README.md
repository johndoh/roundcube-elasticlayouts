Roundcube Webmail ElasticLayouts
================================
This plugin adds list and desktop layouts to the Elastic skin. Similar to
layouts in the Larry skin this means the preview pane is hidden. It also adds
support for choosing the columns shown in the message list (when in list mode)
and support for fixed table headers.

A similar result can also be achieved by [extending][wiki] the Elastic skin.

**This plugin is intended as a proof of concept only.**

ATTENTION
---------
This is just a snapshot from the GIT repository and is **NOT A STABLE version
of ElasticLayouts**. It is Intended for use with the **GIT-master** version
of Roundcube and it may not be compatible with older versions.

License
-------
This plugin is released under the [GNU General Public License Version 3+][gpl].

Even if skins might contain some programming work, they are not considered
as a linked part of the plugin and therefore skins DO NOT fall under the
provisions of the GPL license. See the README file located in the core skins
folder for details on the skin license.

Install
-------
* Place this plugin folder into plugins directory of Roundcube
* Add elasticlayouts to $config['plugins'] in your Roundcube config

**NB:** When downloading the plugin from GitHub you will need to create a
directory called elasticlayouts and place the files in there, ignoring the
root directory in the downloaded archive.

Config
------
This plugin uses the `layout` and `list_cols` settings from the core.

Customisation
-------------
Please refer to the README file included with the Elastic skin for details of
how to customise the skin.

[wiki]: https://github.com/roundcube/roundcubemail/wiki/Skins#extending-skins
[gpl]: https://www.gnu.org/licenses/gpl.html