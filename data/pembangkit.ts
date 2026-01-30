export interface Pembangkit {
  id: string;
  name: string;
  jenis: string;
  region: string;
  lat: string;
  long: string;
  kapasitas: string;
}

export const pembangkitData: Pembangkit[] = [
  {
    id: "2193219391hd238219",
    name: "Teluk Lembu",
    jenis: "PLTGU",
    region: "-",
    lat: "0.5489379796942606",
    long: "101.46035243703854",
    kapasitas: "15 BBTU",
  },
  {
    id: "2367178387y12yhd72",
    name: "Duri",
    jenis: "PLTG",
    region: "-",
    lat: "-6.1706103269971955",
    long: "106.72648089843521",
    kapasitas: "10 BBTU",
  },
  {
    id: "2367178387y12yhd72",
    name: "PLTGU Riau",
    jenis: "PLTGU",
    region: "-",
    lat: "-6.1706103269971955",
    long: "106.72648089843521",
    kapasitas: "10 BBTU",
  },
];
