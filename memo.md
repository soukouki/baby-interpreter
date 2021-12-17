
メモ
=====

言語の仕様などについてのメモ


略語について
-----

|省略したもの|もとの単語|日本語訳|
|--|--|--|
|expr|expression|式|
|stmt|statement|文|
|ident|identifier|識別子|
|args|arguments|引数|
|func|function|関数|
|paren|parenthesis|丸括弧|
|add|addition|足し算|
|sub|subtract|引き算|
|mul|multiply|掛け算|
|div|divide|割り算|
|lt|lesser than|小なり|
|gt|grater than|大なり|


構文について
-----

```ebnf
source = { stmt | def_func } ;

def_func = "def" identifier "(" comma_separated_idents ")" block ;
commma_separated_idents = [ ident { "," ident } ] ;
stmt = expr ";" | assign ";" | if ;
assign = identifier "=" expr ;
if = "if" "(" expr ")" block ;
block = "{" { stmt } "}" ;

expr = add_sub_expr ;
add_sub_expr = func_call_expr { "+" func_call_expr } ;
func_call_expr = identifier "(" comma_separated_exprs ")" | parenthesis_expr ;
comma_separated_exprs = [ expr { "," expr } ] ;
parenthesis_expr = "(" expr ")" | value ;
value = ident | literal ;
literal = number | boolean | null ;
boolean = "true" | "false" ;
null = "null" ;
```
