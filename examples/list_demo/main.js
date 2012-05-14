// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*global ListDemo */

function main() {
  SC.Application.create();
  var ui = SC.LayoutSurface.create();
  ui.set('backgroundColor', 'blue');

  // var list = SC.IListView.create({
  //   layout: { width: 450, height: 500, centerX: -300, centerY: 0 },
  // 
  //   contentBinding: 'ListDemo.arrayController.arrangedObjects',
  //   selectionBinding: 'ListDemo.arrayController.selection',
  // 
  //   renderRow: function(context, width, height, index, object, isSelected, isFirst, isLast) {
  //     context.fillStyle = 'clear';
  //     context.fillRect(0, 0, width, height);
  // 
  //     context.strokeStyle = 'black';
  //     context.lineWidth = 1;
  // 
  //     if (!isLast) {
  //       context.beginPath();
  //       context.moveTo(0, height - 0.5);
  //       context.lineTo(width, height - 0.5);
  //       context.stroke();
  //     }
  // 
  //     context.font = "12pt helvetica, arial, sans";
  //     context.fillStyle = 'white';
  //     context.textAlign = 'left';
  //     context.textBaseline = 'middle';
  // 
  //     context.fillText(object.get('index'), 64, height/2);
  // 
  //     if (isSelected) {
  //       context.beginPath();
  //       context.moveTo(48, height/2 - 7);
  //       context.lineTo(56, height/2 - 1);
  //       context.lineTo(48, height/2 + 5);
  //       context.closePath();
  //       context.fillStyle = 'rgb(252,102,32)';
  //       context.fill();
  //     }
  //   }
  // });
  // list.set('backgroundColor', 'grey');

  // var list2 = SC.IListView.create({
  //   layout: { width: 450, height: 500, centerX: 300, centerY: 0 },
  // 
  //   contentBinding: 'ListDemo.arrayController.arrangedObjects',
  //   selectionBinding: 'ListDemo.arrayController.selection',
  // 
  //   rowHeight: 60,
  // 
  //   createRenderLayerTree: function() {
  //     var tree =  SC.Widget.create({
  // 
  //       render: function(context) {
  //         var bounds = this.get('bounds'),
  //             width = bounds.width,
  //             height = bounds.height,
  //             index = this.get('rowIndex'),
  //             object = this.get('content'),
  //             isSelected = this.get('isSelected');
  //       
  //         context.fillStyle = 'clear';
  //         context.fillRect(0, 0, width, height);
  //       
  //         context.strokeStyle = 'black';
  //         context.lineWidth = 1;
  //       
  //         if (!this.get('isLast')) {
  //           context.beginPath();
  //           context.moveTo(0, height - 0.5);
  //           context.lineTo(width, height - 0.5);
  //           context.stroke();
  //         }
  //       }
  //     });
  // 
  //     var textfield = SC.TextFieldWidget.create({
  //       layout: { top: 5, left: 20, right: 140, height: 22 },
  //       valueBinding: SC.Binding.from('*content.name', tree).noDelay()
  //     });
  // 
  //     tree.addSublayer(textfield);
  // 
  //     var selectwidget = SC.SelectWidget.create({
  //       layout: { bottom: 5, left: 20, width: 100, height: 24 },
  //       theme: 'capsule',
  //       items: [{ title: "Red",
  //                 value: "red",
  //                 enabled: true,
  //                 icon: "button_red" },
  //               "", // Spacer
  //               { title: "Green",
  //                 value: "green",
  //                 enabled: true,
  //                 icon: 'button_green' },
  //               { title: "Purple",
  //                 value: "purple",
  //                 enabled: true,
  //                 icon: 'button_purple' },
  //               { title: "Blue",
  //                 value: "blue",
  //                 enabled: true,
  //                 icon: 'button_blue' }],
  //       valueBinding: SC.Binding.from('*content.color', tree).noDelay(),
  //       itemTitleKey: 'title',
  //       itemValueKey: 'value',
  //       itemIconKey: 'icon',
  //       itemIsEnabledKey: 'enabled'
  //     });
  // 
  //     tree.addSublayer(selectwidget);
  // 
  //     var button = SC.ButtonWidget.create({
  //       layout: { top: 5, right: 20, width: 100, height: 24 },
  //       theme: 'capsule',
  //       action: function() {
  //         console.log('clicked row '+this.getPath('content.index'));
  //       },
  //       titleBinding: SC.Binding.transform(function(val) {
  //         return "Button" + val;
  //       }).from('*content.index', tree).noDelay()
  //     });
  // 
  //     tree.addSublayer(button);
  // 
  //     var checkbox = SC.CheckboxWidget.create({
  //       layout: { bottom: 5, right: 20, width: 100, height: 24 },
  //       title: "Click me",
  //       valueBinding: SC.Binding.from('*content.checkbox', tree).noDelay()
  //     });
  // 
  //     tree.addSublayer(checkbox);
  // 
  //     return tree;
  //   }
  // });
  // list2.set('backgroundColor', 'grey');

  // ui.get('subsurfaces').pushObjects([list, list2]);

  var tableview = SC.TableView.create({
    columns: [SC.TableColumn.create({
      title: 'Name',
      key: 'name'
    }), SC.TableColumn.create({
      title: 'Color',
      key: 'color'
    })],

    layout: { width: 900, height: 500, centerX: 0, centerY: 0 },

    contentBinding: 'ListDemo.arrayController.arrangedObjects',
    selectionBinding: 'ListDemo.arrayController.selection'
  });

  ui.get('subsurfaces').pushObjects([tableview]);

  SC.app.set('ui', ui);
}
