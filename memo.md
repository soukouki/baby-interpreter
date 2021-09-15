
メモ
=====

言語の使用などについてのメモ


構文について
-----

```ebnf
source = { expr , "\n" | "\n" }
expr = add_sub_expr
add_sub_expr = func_call_expr , { "+" , func_call_expr | func_call_expr }
func_call_expr = func_name '(' expr ')' | parenthesis_expr
parenthesis_expr = '(' expr ')' | literal
literal = number
```

exprはexpression(式)の略、stmtはstatement(文)の略
多分LL(1)、だけどまぁPEGっぽい解析方法でいいか