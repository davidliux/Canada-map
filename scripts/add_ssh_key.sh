#!/bin/bash

# 将这个公钥添加到服务器的 ~/.ssh/authorized_keys 文件中
PUBLIC_KEY="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCuJnRExImRLd/k77roEPHoqOp4iDIX/QRzoBBj1eE32ZuuZ3ZT+t8JgBrYIgkTbhgZ8NLNBNZeKoCG8Ok+uGLNq0fa2xU/wfAt5Jerp2k74omEO0m0R3ZF9lv/IkKwfJn9QQGGFc11/IvFycIeKjgKY0DbCImdxGYr4p6ddPa/EPTtIazXphP42ovrZjQkDlnBiGH/6b3VCsNIYqtfJk/Fr9ZNrxXpH59U4i98oweeRSJIqZ7Ed+UX2tckpXuEAaJzOxo6aX+RS4VlnSMdzpCkNlaiRnKK9DYLvehk/CxszZLa53XdRpj3rZXt1M47EYUiz1Qj64+K0FmGU+EHulEWk83xtFG0Qwz4s8g9NSfd4Ai93jsfymEq5hXfJXJS1rPFVy3ZNjGHMBWQkevfDocDs7a9MdnBJI3dX3VyOIDSz+/SbV6pUhTQFNDqt6gGJDrHhL5BDEjr7na6P3lQB2CcDZgm0A0JNRgu+jAdTEqwjzTv12FQUnOTIJ+vmGDvmxqB5GTfrkQWR05AcrO1QwlKse9HE03f9eFjlyeulqWMdKFUCdn0tVJuNynYVHsMKAhnpJE6Ydk+Mo0w5A7WD2auyUINYBO777XIc+CHJ88x5+O4NbT6vuqskP4kb1gkwO7LhLUXuwpqvnuI25h0KhleymN/lQhsti5MM8poiG/9WQ== david@DaviddeMacBook-Pro.local"

echo "请在服务器上执行以下命令来添加SSH密钥："
echo ""
echo "mkdir -p ~/.ssh"
echo "echo '$PUBLIC_KEY' >> ~/.ssh/authorized_keys"
echo "chmod 600 ~/.ssh/authorized_keys"
echo "chmod 700 ~/.ssh"
echo ""
echo "或者直接运行："
echo "curl -s https://raw.githubusercontent.com/davidliux/Canada-map/main/scripts/add_ssh_key.sh | bash"