# Guess IP

## コードの説明

### app.py

```python
import ipaddress
import socket

print("Example: 10.123.45.67")
ip = input("Enter IP> ").strip()

try:
    ipaddress.IPv4Address(ip)
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(1.0)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)

    sock.sendto(b"hello", (ip, 1234))

    try:
        data, _ = sock.recvfrom(4096)
        print(data.decode())
    except socket.timeout:
        print("no response")

except Exception as e:
    print(f"Error: {e}")
```
#### 全体像
「入力されたIPアドレスのUDP1234番ポートにhelloを送り、返事が来たら表示するプログラム」

#### 1.import

```python
import ipaddress
import socket
```

・```ipaddress```は、IPアドレスの形式チェックや計算ができる標準ライブラリです。ここでは入力の検証にだけ使います。

・```socket```は、ネットワーク通信を行う標準ライブラリです。

#### 2.入力

```python
print("Example: 10.123.45.67")
ip = input("Enter IP> ").strip()
```

・入力例を表示します。

・```input()```でユーザーから文字列を受け取り、```.strip()```で前後の空白や改行を取り除きます。

#### 3.tryブロック

```python
try:
    ipaddress.IPv4Address(ip)
```

・```IPv4Address(ip)```は、文字列が正しいIPv4形式(0~255の数字4つを```.```でつないだもの)かを調べる。

・不正ならAddressValueErrorが出て、一番下の```except Exception```に飛びます。

・戻り値は使っていない。例外が出るかどうかだけが目的です。

・注意点として、これは形式が正しいかしか見ていません。```255.255.255.255```や```10.255.255.255```のようなブロードキャストアドレスも、形式としては正しいので通ります。

#### 4.ソケットの作成

```python
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
'''

・```AF_INET```はIPv4を使うという指定です。

・```SOCK_DGRAM```はUDPを使うという指定です。
UDPは接続を確立せず、データ(データグラム)を投げっぱなしで送ります。TCPと違い、届いたかどうかの保証はありません。

### 5.タイムアウトの設定

```python
sock.settimeout(1.0)
```

送信や受信で待つ時間を最大1秒にします。これがないと、返事が来ない場合に```recvfrom```が永遠に待ち続けます。

#### 6.ブロードキャストの許可

```python
sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
```

・```setsockopt```はソケットの動作設定を変える関数です。

・```SO_BROADCAST```を1にすると、ブロードキャストアドレス宛ての送信が許可されます。

・ブロードキャストとは、同じネットワーク内の全員に一斉に送る方法です。

・この設定がないと、ブロードキャストアドレスに送ろうとした時点で```PermissionError```になります。

#### 7.送信

```python
sock.sendto(b"hello", (ip, 1234))
```

・```b"hello"```はバイト列です。ネットワークには文字列ではなくバイト列を送ります。

・```(ip, 1234)```は宛先で、IPアドレスとポート番号の組です。

・UDPなので、事前の接続は不要です。

・このソケットは```bind```していませんが、最初の送信時にOSが送信元のポートを自動で割り当てます。返事はその割り当てられたポートに届くので、そのまま受信できます。

#### 8.受信

```python
    try:
        data, _ = sock.recvfrom(4096)
        print(data.decode())
    except socket.timeout:
        print("no response")
```

・```recvfrom(4096)```は、データグラムを1つ受け取ります。(最大4096バイト)戻り値は```(データ、送信元アドレス)```です。

・```_```は「使わない値」の慣習的な名前です。つまり送信元を確認していません。送った相手以外から届いた返事でも受け取ります。

・data.decode()はバイト列を文字列に変換します(デフォルトはUTF-8)。

・```recvfrom```は1回しか読んでいないので、最初に届いた1つの返事だけを表示します。

・1秒以内に何も来なければ```socket.timeout```が出て、```no response```と表示します。これは以上ではなく通常の結果として扱っています。

#### 9.except

```python
except Exception as e:
    print(f"Error: {e}")
```

tryブロック内で起きた、socket.timeout以外のエラーをまとめて受けて表示します。主なものは次の通りです。

・IPアドレスの形式が不正
・ソケット関連のエラー
・返事がUTF-8として読めない場合
(```UnicodeDecodeError```)

### server.py

```python
import os
import psutil
import socket

FLAG = os.environ.get("FLAG", "Alpaca{REDACTED}")

message = (
    f"Hello from {psutil.net_if_addrs()['eth0'][0].address}\n"
    f"Here is your flag: {FLAG}"
)

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind(("0.0.0.0", 1234))

while True:
    data, addr = sock.recvfrom(4096)
    sock.sendto(message.encode(), addr)
```

#### 全体像
UDP1234番ポートで待ち受け、誰からでも何か届いたら、フラグ入りのメッセージを送り返すサーバーです。前のクライアントコードの相手側に当たります。

#### 1.import
```python
import os
import psutil
import socket
```

・```os```は環境変数を読むために使います。
・```psutil```は、システムやネットワークの情報を取得する外部ライブラリです(標準ライブラリではなく、pip install psutilが必要です)。
・```socket```はネットワーク通信用です。

#### 2.フラグ
```python
FLAG = os.environ.get("FLAG", "Alpaca{REDACTED}")
```

環境変数```FLAG```の値を取得します。設定されていなければ、第2引数のダミー値```Alpaca{REDActed}```になります。実際のサーバーでは本物フラグが環境編で渡され、手元で試すときはダミーが出ます。

#### 3.返信メッセージの組み立て
```python
message = (
    f"Hello from {psutil.net_if_addrs()['eth0'][0].address}\n"
    f"Here is your flag: {FLAG}")
```

・```psutil.net_if_addrs()```は、ネットワークインターフェースごとのアドレス情報を辞書で返します。

・```['eth0']```で、```eth0```というインターフェース(Docker環境では通常、コンテナの外向きNIC)を選びます。

・```[0].address```は、そのインターフェースの最初のアドレスです。Docker環境では通常、そのコンテナ自身のIPv4アドレスになります。

・結果として、メッセージは次のような2行になります。

```Hello from 10.x.x.x
Here is your flag: Alpaca{...}
```

注目点は2つあります。
・文字列は起動時に1回だけ作られます。リクエストのたびに作り直してはいません。

・返信にサーバー自身のIPが含まれるので、返事をもらえれば、サーバーのIPも分かる作りです。問題名の「Guess IP」のタイトル回収になります。

#### 4.ソケットの作成とバインド
```python
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind(("0.0.0.0", 1234))
```

・1行目は、IPv4のUDPソケットを作ります。

・```bind```は、このソケットを特定のアドレスとポートに結び付け、そこに届いたデータを受け取るようにします。

・```0.0.0.0```は「このマシンのすべてのインターフェース・すべてのアドレスで受け付ける」という意味です。

・```1234```は待ち受けるポート番号です。クライアント側が送っていた宛先ポートと一致します。

```0.0.0.0```にバインドしていることが重要です。特定のIPにバインドすると、そのIP宛てのパケットしか受け取れません。```0.0.0.0```なら、ブロードキャスト宛てのパケットも受け取れます。

#### 5.無限ループでの受信と返信
```python
while True:
    data, addr = sock.recvfrom(4096)
    sock.sendto(message.encode(), addr)
```

・```while True```で、サーバーが止まるまで繰り返します。

・```recvfrom(4096)```は、データグラムが届くまで待ち(ここではタイムあるとなし、)```(データ、送信元アドレス)```を返します。

・```data```は使っていません。```hello```でもほかの何でも、届きさえすれば同じ返事をします。

・```addr```は```(IP,ポート)```のタプルで、送ってきた相手のアドレスです。

・```message.encode()```は文字列をバイト列(UTF-8)に変換します。ネットワークにはバイト列しか送れないためです。

・```sendto(..., addr)```で、送信元にそのまま返信します。

## writeup
[Guess IP - alpacahack](https://alpacahack.com/daily/challenges/guess-ip?utm_source=chatgpt.com)