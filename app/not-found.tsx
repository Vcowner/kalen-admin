/*
 * @Author: liaokt
 * @Description: not-found-page
 * @Date: 2024-04-29 15:52:59
 * @LastEditors: liaokt
 * @LastEditTime: 2024-04-29 17:54:14
 */

import { Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import "./globals.css";

// TODO: 背景中的图片和文字都要单独拿出来做布局
const NotFoundPage = () => {
  return (
    <div className={"not_found"}>
      <Button icon={<ArrowLeftOutlined />} shape={"round"} type={"primary"} style={{ marginLeft: "2.8vw" }}>
        {"BACK TO LAST PAGE"}
      </Button>
    </div>
  );
};
export default NotFoundPage;
