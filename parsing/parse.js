/*globals require */
var child_process = require('child_process'),
    fs = require('fs'),
    util = require('util'),
    assert = require('assert');

var visit = {};

function log(obj) {
  console.log(util.inspect(obj, false, null) + '\n');
}

var INDENT = '  ';
var format = function(ast, indent) {
  indent = indent || '';

  var formatter = visit[ast.type];
  if (formatter) return formatter(ast, indent);
  console.error('no formatter for type: ' + ast.type);
  var fun = '\n\nformat.' + ast.type + ' = function(node) {\n';
  for (var prop in ast){
    if (prop != 'type') {
      fun += '\tnode.' + prop + '\n';
    }
  }
  fun += '};\n';
  console.log(fun);
  log(ast);
  return '';
};

visit.Program = function(ast, indent) {
  return ast.elements.map(function(node) {
    return format(node, '');
  }).join('\n');
};

visit.NumericLiteral = function(node, indent) {
  return node.value;
};

visit.UnaryExpression = function(node, indent) {
  return node.operator + ' ' + format(node.expression);
};

visit.BinaryExpression = function(node, indent) {
  return format(node.left) + ' ' + node.operator + ' ' + format(node.right);
};

visit.ConditionalExpression = function(node, indent) {
  return format(node.condition, indent) + ' ? ' +
    format(node.trueExpression, indent) + ' : ' +
    format(node.falseExpression, indent);
};

visit.ParenthesizedExpression = function(node, indent) {
  return "(" + format(node.value, indent) + ")";
};

visit.VariableStatement = function(node, indent) {
  return 'var ' + node.declarations.map(function(declaration) {
    return format(declaration, indent);
  }).join(', ') + ';';
};

visit.VariableDeclarations = function(node, indent) {
  return 'var ' + node.declarations.map(function(declaration) {
    return format(declaration, indent);
  }).join(', ');
};

visit.VariableDeclaration = function(node, indent) {
  if (!node.value) return node.name;
  return node.name + ' = ' + format(node.value, indent);
};

visit.FunctionCall = function(node, indent) {
  return format(node.name, indent) + '(' + node['arguments'].map(function(argument) {
    return format(argument, indent);
  }).join(', ') + ')';
};

visit.Function = function(node, indent) {
  return (node.name? 'function ' + node.name : 'function') + '(' + node.params.join(', ') + ') {\n' +
    node.elements.map(function(element) {
      return indent + INDENT + format(element, indent + INDENT);
    }).join('\n') + '\n' + indent + '}';
};

visit.StringLiteral = function(node, indent) {
  return JSON.stringify(node.value);
};

visit.BooleanLiteral = function(node, indent) {
  return node.value ? 'true' : 'false';
};

visit.NullLiteral = function(node, indent) {
  return 'null';
};

visit.Variable = function(node, indent) {
  return node.name;
};

visit.PropertyAccess = function(node, indent) {
  var base = format(node.base, indent);
  if (node.name.type) return base + '[' + format(node.name, indent) + ']';
  else return base + '.' + node.name;
};

visit.IfStatement = function(node, indent) {
  var result = 'if (' + format(node.condition) + ') ' + format(node.ifStatement, indent);
  if (node.elseStatement){
    result += ' else ' + format(node.elseStatement, indent);
  }
  return result;
};

visit.Block = function(node, indent) {
  return '{\n' + node.statements.map(function(statement) {
    return indent + INDENT + format(statement, indent + INDENT) + '\n';
  }).join('') + indent + '}';
};

visit.ReturnStatement = function(node, indent) {
  if (!node.value) return 'return;';
  return 'return ' + format(node.value, indent) + ';';
};

visit.EmptyStatement = function(node, indent) {
  return ';';
};

visit.ExpressionStatement = function(node, indent) {
  return format(node.value, indent) + ';';
};

visit.AssignmentExpression = function(node, indent) {
  return format(node.left) + ' ' + node.operator + ' ' + format(node.right, indent);
};

visit.PostfixExpression = function(node, indent) {
  return format(node.expression) + node.operator;
};

visit.ArrayLiteral = function(node, indent) {
  return '[' + node.elements.map(function(element){
    return format(element, indent);
  }).join(', ') + ']';
};

visit.ObjectLiteral = function(node, indent) {
  if (node.properties.length === 0) return '{}';
  return '{\n' + node.properties.map(function(property){
    return indent + INDENT + format(property, indent);
  }).join(',\n') + '\n' + indent + '}';
};

visit.RegularExpressionLiteral = function(node, indent) {
  return '/' + node.body + '/' + node.flags;
};

visit.This = function(node, indent) {
  return 'this';
};

visit.ThrowStatement = function(node, indent) {
  return 'throw ' + format(node.exception, indent);
};

visit.ForStatement = function(node, indent) {
  return 'for (' +
    (node.initializer ? format(node.initializer) : '') + '; ' +
    (node.test ? format(node.test) : '') + '; ' +
    (node.counter ? format(node.counter) : '') + ')' +
    format(node.statement, indent);
};

visit.ForInStatement = function(node, indent) {
  return 'for (' +
    format(node.iterator) + ' in ' +
    format(node.collection) + ') ' +
    format(node.statement, indent);
};

visit.WhileStatement = function(node, indent) {
  return 'while (' + format(node.condition) + ') ' + format(node.statement, indent);
};

visit.DoWhileStatement = function(node, indent) {
  return 'do ' + format(node.statement, indent) + ' while (' + format(node.condition) + ');';
};

visit.SwitchStatement = function(node, indent) {
  return 'switch (' + format(node.expression, indent) + '){\n' + node.clauses.map(function(clause){
    return indent + INDENT + format(clause, indent + INDENT);
  }).join('\n') + '\n' + indent + '}';
};

visit.CaseClause = function(node, indent) {
  return 'case ' + format(node.selector, indent) + ':\n' + node.statements.map(function(statement){
    return indent + INDENT + format(statement, indent + INDENT);
  }).join('\n');
};

visit.DefaultClause = function(node, indent) {
  return 'default:\n' + node.statements.map(function(statement){
    return indent + INDENT + format(statement, indent + INDENT);
  }).join('\n');
};

visit.BreakStatement = function(node, indent) {
  return node.label ? 'break ' + node.label + ';' : 'break;';
};

visit.ContinueStatement = function(node, indent) {
  return node.label ? 'continue ' + node.label + ';' : 'continue;';
};

visit.TryStatement = function(node, indent) {
  return 'try ' + format(node.block, indent) +
    (node['catch'] ? format(node['catch'], indent) : '')+ 
    (node['finally'] ? format(node['finally'], indent) : '');
};

visit.Catch = function(node, indent) {
  return ' catch (' + node.identifier + ')' + format(node.block, indent);
};

visit.Finally = function(node, indent) {
  return ' finally ' + format(node.block, indent);
};

visit.PropertyAssignment = function(node, indent) {
  return JSON.stringify(node.name) + ': ' + format(node.value, indent + INDENT);
};

visit.NewOperator = function(node, indent) {
  return 'new ' + format(node.constructor, indent) + '(' + node['arguments'].map(function(argument){
    return format(argument, indent);
  }).join(', ') + ')';
};

visit.Globals = function(node, indent) {
  // console.log(node);
  return node.value;
};

visit.JSLintOptions = function(node, indent) {
  // console.log(node);
  return node.value;
};

visit.Documentation = function(node, indent) {
  // console.log(node);
  return node.value;
};

function printDocumentation(program) {
  // console.log(JSON.stringify(program, null, '  '));
  assert(program.type === 'Program');
  var result = visit.Program(program);
  console.log(result);
}

// var pegjs = child_process.spawn('pegjs', ['BlossomScript.pegjs']);
// pegjs.on('exit', function (code) {
//   var Parser = require('./BlossomScript');
//   printDocumentation(Parser.parse(fs.readFileSync('../foundation/core.js', 'utf8')));
// });

var pegjs = child_process.spawn('pegjs', ['BareScript.pegjs']);
pegjs.on('exit', function (code) {
  var Parser = require('./BareScript');
  console.log(JSON.stringify(Parser.parse(fs.readFileSync('../foundation/core.js', 'utf8')), null, '  '));
});
