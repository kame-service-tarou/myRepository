# Packets Primer

## Writeup
[Packers Primer - CyLab Security Academy](https://learn.cylabacademy.org/library/286?page=3&difficulty=2&category=4)

PCAPファイルをWiresharkで解析し、通信データの中に隠されたFlagを見つける問題。

### 1.PCAPファイルをWiresharkで開く
配布された'nerwork-dump.flag.pcap'をWiresharkで開く。
PCAPファイルには、ネットワーク上を流れた通信データが記録されている。

### 2.TCPパケットを調べる
表示されたパケットを確認し、TCP通信に注目する。
TCPの接続を確立するためのハンドシェイクと、実際にデータを送信しているパケットを区別する。

### 3.データ本体を確認する
対象のパケットを選択し、画面下部のパケット詳細やバイト列の表示を確認する。
ASCII欄にFlagの一部と思われる文字列が表示されていることを確認する。
<img src="image.png" width="500">

### 4.TCPストリームを確認する
対象のパケットを右クリックし、
'追跡　→　TCPストリーム'
を選択する。
通信内容を確認し、Flagに該当する文字列を読み取る。
<img src="image-1.png" width="400" height="500">
<img src="image-2.png" width="400" height="500">

## 知識

今回配布されたファイルの拡張子はPCAPでこれはネットワーク上を流れるパケットを記録するためのファイル形式です。


