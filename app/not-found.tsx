/*
 * @Author: liaokt
 * @Description: not-found-page
 * @Date: 2024-04-29 15:52:59
 * @LastEditors: liaokt
 * @LastEditTime: 2024-04-30 10:15:44
 */

"use client";

import { Button } from "antd";
import { useRouter } from "next/navigation";
import Image from "next/image";
import "./globals.css";

const NotFoundPage = () => {
  const router = useRouter();

  const onBack = () => {
    router.back();
  };

  return (
    <div className={"not_found"}>
      <div className={"img_404"}>
        <Image src="/imgs/img_404.png" alt="404 Not Found" layout="fill" objectFit="contain" />
      </div>
      <div className={"text_404"}>
        <Image src="/imgs/text_404.png" alt="404 Not Found" layout="fill" objectFit="contain" />
      </div>
      <Button
        onClick={() => {
          onBack();
        }}
        className={"button_404"}
        shape={"round"}
        type={"primary"}>
        {"BACK TO LAST PAGE"}
      </Button>
    </div>
  );
};
export default NotFoundPage;
