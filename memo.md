
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
|func|function|関数|
|paren|parenthesis|丸括弧|
|add|addition|足し算|
|sub|subtract|引き算|
|mul|multiply|掛け算|
|div|divide|割り算|


構文について
-----

```ebnf
source = { expr , "\n" | "\n" }
expr = add_sub_expr
add_sub_expr = func_call_expr , { "+" , func_call_expr }
func_call_expr = identifier '(' expr ')' | parenthesis_expr
parenthesis_expr = '(' expr ')' | value
value = identifier | literal
literal = number
```

